using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using LANHossting.Application.Interfaces;
using LANHossting.Application.DTOs;
using LANHossting.Filters;
using LANHossting.Hubs;

namespace LANHossting.Controllers
{
    [AuthorizeRole("ADMIN", "NHAN_VIEN_KHO")]
    [Route("api/kho")]
    [ApiController]
    public class KhoAPIController : ControllerBase
    {
        private readonly ITonKhoService _tonKhoService;
        private readonly IVatLieuService _vatLieuService;
        private readonly IGiaoDichService _giaoDichService;
        private readonly INhatKyService _nhatKyService;
        private readonly IHubContext<KhoHub> _hubContext;

        public KhoAPIController(
            ITonKhoService tonKhoService,
            IVatLieuService vatLieuService,
            IGiaoDichService giaoDichService,
            INhatKyService nhatKyService,
            IHubContext<KhoHub> hubContext)
        {
            _tonKhoService = tonKhoService;
            _vatLieuService = vatLieuService;
            _giaoDichService = giaoDichService;
            _nhatKyService = nhatKyService;
            _hubContext = hubContext;
        }

        // GET: api/kho/tonkho?khoId=1&search=optional
        [HttpGet("tonkho")]
        public async Task<IActionResult> GetTonKho([FromQuery] int khoId, [FromQuery] string? search = null)
        {
            var result = await _tonKhoService.GetTonKhoAsync(khoId, search);
            return Ok(result);
        }

        // GET: api/kho/dashboard/thong-ke?khoId=optional
        [HttpGet("dashboard/thong-ke")]
        public async Task<IActionResult> GetDashboardThongKe([FromQuery] int? khoId = null)
        {
            var result = await _tonKhoService.GetDashboardThongKeAsync(khoId);
            return Ok(result);
        }

        // GET: api/kho/danhsachkho
        [HttpGet("danhsachkho")]
        public async Task<IActionResult> GetDanhSachKho()
        {
            var result = await _tonKhoService.GetDanhSachKhoAsync();
            return Ok(result);
        }

        // POST: api/kho/themvattu - Thêm vật tư mới
        [HttpPost("themvattu")]
        public async Task<IActionResult> ThemVatTu([FromBody] CreateVatLieuDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(new ServiceResult
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ.",
                    Errors = errors
                });
            }

            var result = await _vatLieuService.CreateVatLieuAsync(dto);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        // POST: api/kho/giaodich - Nhập/Xuất/Điều chuyển kho
        [HttpPost("giaodich")]
        public async Task<IActionResult> GiaoDich([FromBody] GiaoDichBatchDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(new ServiceResult
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ.",
                    Errors = errors
                });
            }

            // Get session info
            var userIdStr = HttpContext.Session.GetString("UserId");
            var sessionIdStr = HttpContext.Session.GetString("SessionId");
            var taiKhoanId = int.TryParse(userIdStr, out var uid) ? uid : 0;
            var phienLamViecId = int.TryParse(sessionIdStr, out var sid) ? sid : 0;

            if (taiKhoanId <= 0 || phienLamViecId <= 0)
            {
                return Unauthorized(new ServiceResult
                {
                    Success = false,
                    Message = "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại."
                });
            }

            var result = await _giaoDichService.ExecuteAsync(dto, taiKhoanId, phienLamViecId);

            if (!result.Success)
                return BadRequest(result);

            var username = HttpContext.Session.GetString("TenNguoiDung") ?? "Nhân viên kho";
            await _hubContext.Clients.All.SendAsync("ReceivePendingTicketsUpdate", result.Message, username, "CREATING");
            await _hubContext.Clients.All.SendAsync("ReceiveStockUpdate", dto.KhoId, $"Có giao dịch mới từ {username}");
            await _hubContext.Clients.All.SendAsync("ReceiveLogUpdate", $"Đã có phiếu giao dịch mới");

            return Ok(result);
        }

        // GET: api/kho/nhomvatlieu - Dropdown NhomVatLieu
        [HttpGet("nhomvatlieu")]
        public async Task<IActionResult> GetNhomVatLieu()
        {
            var result = await _vatLieuService.GetNhomVatLieuAsync();
            return Ok(result);
        }

        // GET: api/kho/donvitinh - Dropdown DonViTinh
        [HttpGet("donvitinh")]
        public async Task<IActionResult> GetDonViTinh()
        {
            var result = await _vatLieuService.GetDonViTinhAsync();
            return Ok(result);
        }

        // ═══ NHẬT KÝ (AUDIT LOG) ENDPOINTS ═══

        // GET: api/kho/lichsu - Danh sách phiếu (paginated + filtered)
        [AuthorizeRole("ADMIN")]
        [HttpGet("lichsu")]
        public async Task<IActionResult> GetLichSu(
            [FromQuery] DateTime? tuNgay,
            [FromQuery] DateTime? denNgay,
            [FromQuery] int? khoId,
            [FromQuery] string? loaiThayDoi,
            [FromQuery] int? vatLieuId,
            [FromQuery] string? searchVatLieu,
            [FromQuery] int? taiKhoanId,
            [FromQuery] string? trangThai,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var filter = new NhatKyFilterDto
            {
                TuNgay = tuNgay,
                DenNgay = denNgay,
                KhoId = khoId,
                LoaiThayDoi = loaiThayDoi,
                VatLieuId = vatLieuId,
                SearchVatLieu = searchVatLieu,
                TaiKhoanId = taiKhoanId,
                TrangThai = trangThai,
                Page = page,
                PageSize = pageSize
            };

            var result = await _nhatKyService.GetDanhSachPhieuAsync(filter);
            return Ok(result);
        }

        // GET: api/kho/lichsu/{phieuId} - Chi tiết 1 phiếu
        [AuthorizeRole("ADMIN")]
        [HttpGet("lichsu/{phieuId:int}")]
        public async Task<IActionResult> GetChiTietPhieu(int phieuId)
        {
            var result = await _nhatKyService.GetChiTietPhieuAsync(phieuId);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy phiếu." });
            return Ok(result);
        }
    }
}
