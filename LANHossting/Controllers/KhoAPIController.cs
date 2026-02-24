using Microsoft.AspNetCore.Mvc;
using LANHossting.Application.Interfaces;
using LANHossting.Application.DTOs;
using LANHossting.Filters;

namespace LANHossting.Controllers
{
    /// <summary>
    /// Thin API controller for warehouse inventory queries.
    /// Delegates all logic to ITonKhoService / IVatLieuService.
    /// Contains ZERO business logic, ZERO direct DbContext usage.
    /// 
    /// PRICING RULE: DonGia = VatLieu.DonGia (exclusively).
    /// System NEVER derives price from transaction history.
    /// </summary>
    [AuthorizeRole("ADMIN", "NHAN_VIEN_KHO")]
    [Route("api/kho")]
    [ApiController]
    public class KhoAPIController : ControllerBase
    {
        private readonly ITonKhoService _tonKhoService;
        private readonly IVatLieuService _vatLieuService;
        private readonly IGiaoDichService _giaoDichService;

        public KhoAPIController(
            ITonKhoService tonKhoService,
            IVatLieuService vatLieuService,
            IGiaoDichService giaoDichService)
        {
            _tonKhoService = tonKhoService;
            _vatLieuService = vatLieuService;
            _giaoDichService = giaoDichService;
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
    }
}
