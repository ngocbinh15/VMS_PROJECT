using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using LANHossting.Application.Interfaces;
using LANHossting.Application.DTOs;
using LANHossting.Filters;
using LANHossting.Hubs;

namespace LANHossting.Controllers
{
    [AuthorizeRole("ADMIN")]
    [Route("api/admin")]
    [ApiController]
    public class AdminAPIController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly ISystemLogService _logService;
        private readonly IVatLieuService _vatLieuService;
        private readonly IGiaoDichService _giaoDichService;
        private readonly IHubContext<KhoHub> _hubContext;

        public AdminAPIController(
            IAdminService adminService,
            ISystemLogService logService,
            IVatLieuService vatLieuService,
            IGiaoDichService giaoDichService,
            IHubContext<KhoHub> hubContext)
        {
            _adminService = adminService;
            _logService = logService;
            _vatLieuService = vatLieuService;
            _giaoDichService = giaoDichService;
            _hubContext = hubContext;
        }

        // ══════════════════════════════════════════
        // TÀI KHOẢN
        // ══════════════════════════════════════════

        // GET: api/admin/taikhoan
        [HttpGet("taikhoan")]
        public async Task<IActionResult> GetDanhSachTaiKhoan()
        {
            var result = await _adminService.GetDanhSachTaiKhoanAsync();
            return Ok(result);
        }

        // POST: api/admin/taikhoan
        [HttpPost("taikhoan")]
        public async Task<IActionResult> CreateTaiKhoan([FromBody] CreateTaiKhoanDto dto)
        {
            var userId = GetCurrentUserId();
            var ip = GetClientIP();
            var result = await _adminService.CreateTaiKhoanAsync(dto, userId, ip);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // PUT: api/admin/taikhoan
        [HttpPut("taikhoan")]
        public async Task<IActionResult> UpdateTaiKhoan([FromBody] UpdateTaiKhoanDto dto)
        {
            var userId = GetCurrentUserId();
            var ip = GetClientIP();
            var result = await _adminService.UpdateTaiKhoanAsync(dto, userId, ip);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // DELETE: api/admin/taikhoan/{id}
        [HttpDelete("taikhoan/{id:int}")]
        public async Task<IActionResult> DeleteTaiKhoan(int id)
        {
            var userId = GetCurrentUserId();
            var ip = GetClientIP();
            var result = await _adminService.DeleteTaiKhoanAsync(id, userId, ip);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // POST: api/admin/taikhoan/{id}/toggle-status
        [HttpPost("taikhoan/{id:int}/toggle-status")]
        public async Task<IActionResult> ToggleTrangThai(int id)
        {
            var userId = GetCurrentUserId();
            var ip = GetClientIP();
            var result = await _adminService.ToggleTrangThaiAsync(id, userId, ip);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // POST: api/admin/taikhoan/{id}/reset-password
        [HttpPost("taikhoan/{id:int}/reset-password")]
        public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordDto dto)
        {
            dto.TaiKhoanId = id;
            var userId = GetCurrentUserId();
            var ip = GetClientIP();
            var result = await _adminService.ResetPasswordAsync(dto, userId, ip);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ══════════════════════════════════════════
        // VAI TRÒ
        // ══════════════════════════════════════════

        // GET: api/admin/vaitro
        [HttpGet("vaitro")]
        public async Task<IActionResult> GetDanhSachVaiTro()
        {
            var result = await _adminService.GetDanhSachVaiTroAsync();
            return Ok(result);
        }

        // ══════════════════════════════════════════
        // VẬT LIỆU
        // ══════════════════════════════════════════

        // GET: api/admin/vatlieu
        [HttpGet("vatlieu")]
        public async Task<IActionResult> GetDanhSachVatLieu()
        {
            var result = await _adminService.GetDanhSachVatLieuAsync();
            return Ok(result);
        }

        // PUT: api/admin/vatlieu
        [HttpPut("vatlieu")]
        public async Task<IActionResult> UpdateVatLieu([FromBody] UpdateVatLieuDto dto)
        {
            var userId = GetCurrentUserId();
            var ip = GetClientIP();
            var result = await _adminService.UpdateVatLieuAsync(dto, userId, ip);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // DELETE: api/admin/vatlieu/{id}
        [HttpDelete("vatlieu/{id:int}")]
        public async Task<IActionResult> DeleteVatLieu(int id)
        {
            var userId = GetCurrentUserId();
            var ip = GetClientIP();
            var result = await _adminService.DeleteVatLieuAsync(id, userId, ip);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ══════════════════════════════════════════
        // NHẬT KÝ HỆ THỐNG
        // ══════════════════════════════════════════

        // GET: api/admin/systemlog
        [HttpGet("systemlog")]
        public async Task<IActionResult> GetSystemLog([FromQuery] SystemLogFilterDto filter)
        {
            var result = await _logService.GetLogsAsync(filter);
            return Ok(result);
        }

        // ══════════════════════════════════════════
        // KHO
        // ══════════════════════════════════════════

        // GET: api/admin/kho
        [HttpGet("kho")]
        public async Task<IActionResult> GetDanhSachKho()
        {
            var result = await _adminService.GetDanhSachKhoAdminAsync();
            return Ok(result);
        }

        // POST: api/admin/kho
        [HttpPost("kho")]
        public async Task<IActionResult> CreateKho([FromBody] AdminKhoDto dto)
        {
            var userId = GetCurrentUserId();
            var ip = GetClientIP();
            var result = await _adminService.CreateKhoAsync(dto.TenKho, dto.DiaChi, dto.MoTa, userId, ip);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // PUT: api/admin/kho
        [HttpPut("kho")]
        public async Task<IActionResult> UpdateKho([FromBody] AdminKhoDto dto)
        {
            var userId = GetCurrentUserId();
            var ip = GetClientIP();
            var result = await _adminService.UpdateKhoAsync(dto.Id, dto.TenKho, dto.DiaChi, dto.MoTa, userId, ip);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // DELETE: api/admin/kho/{id}
        [HttpDelete("kho/{id:int}")]
        public async Task<IActionResult> DeleteKho(int id)
        {
            var userId = GetCurrentUserId();
            var ip = GetClientIP();
            var result = await _adminService.DeleteKhoAsync(id, userId, ip);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ══════════════════════════════════════════
        // THÊM VẬT TƯ MỚI (ADMIN)
        // ══════════════════════════════════════════

        // POST: api/admin/vatlieu
        [HttpPost("vatlieu")]
        public async Task<IActionResult> CreateVatLieu([FromBody] CreateVatLieuDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(new ServiceResult { Success = false, Message = "Dữ liệu không hợp lệ.", Errors = errors });
            }
            var result = await _vatLieuService.CreateVatLieuAsync(dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // GET: api/admin/nhomvatlieu
        [HttpGet("nhomvatlieu")]
        public async Task<IActionResult> GetNhomVatLieu()
        {
            var result = await _vatLieuService.GetNhomVatLieuAsync();
            return Ok(result);
        }

        // GET: api/admin/donvitinh
        [HttpGet("donvitinh")]
        public async Task<IActionResult> GetDonViTinh()
        {
            var result = await _vatLieuService.GetDonViTinhAsync();
            return Ok(result);
        }

        // ══════════════════════════════════════════
        // THÊM VẬT LIỆU VÀO KHO
        // ══════════════════════════════════════════

        // GET: api/admin/kho/{khoId}/vatlieu
        [HttpGet("kho/{khoId:int}/vatlieu")]
        public async Task<IActionResult> GetVatLieuForKho(int khoId)
        {
            var result = await _adminService.GetVatLieuForKhoAsync(khoId);
            return Ok(result);
        }

        // POST: api/admin/kho/{khoId}/vatlieu
        [HttpPost("kho/{khoId:int}/vatlieu")]
        public async Task<IActionResult> AddVatLieuToKho(int khoId, [FromBody] AddVatLieuToKhoRequest dto)
        {
            var userId = GetCurrentUserId();
            var ip = GetClientIP();
            var result = await _adminService.AddVatLieuToKhoAsync(khoId, dto.VatLieuIds, userId, ip);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ══════════════════════════════════════════
        // PHÊ DUYỆT PHIẾU GIAO DỊCH
        // ══════════════════════════════════════════

        // GET: api/admin/phieu-cho-duyet
        [HttpGet("phieu-cho-duyet")]
        public async Task<IActionResult> GetDanhSachPhieuChoDuyet()
        {
            var result = await _giaoDichService.GetDanhSachPhieuChoDuyetAsync();
            return Ok(result);
        }

        // POST: api/admin/phieu/{id}/duyet
        [HttpPost("phieu/{id:int}/duyet")]
        public async Task<IActionResult> DuyetPhieu(int id)
        {
            var userId = GetCurrentUserId();
            var phienId = HttpContext.Session.GetInt32("PhienLamViecId") ?? 1;
            var result = await _giaoDichService.DuyetPhieuAsync(id, userId, phienId);
            if (result.Success)
            {
                var adminName = HttpContext.Session.GetString("TenNguoiDung") ?? "Quản trị viên";
                await _hubContext.Clients.All.SendAsync("ReceivePendingTicketsUpdate", result.Message, adminName, "DUYET");
                await _hubContext.Clients.All.SendAsync("ReceiveTicketStatusUpdate", id.ToString(), "Đã duyệt", null);
                await _hubContext.Clients.All.SendAsync("ReceiveStockUpdate", 0, result.Message);
                await _hubContext.Clients.All.SendAsync("ReceiveLogUpdate", result.Message);
                return Ok(result);
            }
            return BadRequest(result);
        }

        // POST: api/admin/phieu/{id}/tu-choi
        [HttpPost("phieu/{id:int}/tu-choi")]
        public async Task<IActionResult> TuChoiPhieu(int id, [FromBody] TuChoiPhieuDto? dto)
        {
            var userId = GetCurrentUserId();
            var result = await _giaoDichService.TuChoiPhieuAsync(id, userId, dto?.LyDo);
            if (result.Success)
            {
                var adminName = HttpContext.Session.GetString("TenNguoiDung") ?? "Quản trị viên";
                await _hubContext.Clients.All.SendAsync("ReceivePendingTicketsUpdate", result.Message, adminName, "TU_CHOI");
                await _hubContext.Clients.All.SendAsync("ReceiveTicketStatusUpdate", id.ToString(), "Từ chối", dto?.LyDo);
                await _hubContext.Clients.All.SendAsync("ReceiveLogUpdate", result.Message);
                return Ok(result);
            }
            return BadRequest(result);
        }

        // POST: api/admin/phieu/{id}/rollback
        [HttpPost("phieu/{id:int}/rollback")]
        public async Task<IActionResult> RollbackPhieu(int id, [FromBody] TuChoiPhieuDto? dto)
        {
            var userId = GetCurrentUserId();
            var phienId = HttpContext.Session.GetInt32("PhienLamViecId") ?? 1;
            var result = await _giaoDichService.RollbackPhieuAsync(id, userId, phienId, dto?.LyDo);
            if (result.Success)
            {
                var adminName = HttpContext.Session.GetString("TenNguoiDung") ?? "Quản trị viên";
                await _hubContext.Clients.All.SendAsync("ReceivePendingTicketsUpdate", result.Message, adminName, "HOAN_TAC");
                await _hubContext.Clients.All.SendAsync("ReceiveTicketStatusUpdate", id.ToString(), "Đã hoàn tác", dto?.LyDo);
                await _hubContext.Clients.All.SendAsync("ReceiveStockUpdate", 0, result.Message);
                await _hubContext.Clients.All.SendAsync("ReceiveLogUpdate", result.Message);
                return Ok(result);
            }
            return BadRequest(result);
        }

        // ══════════════════════════════════════════
        // CẢNH BÁO TỒN KHO TỐI THIỂU
        // ══════════════════════════════════════════

        // GET: api/admin/canh-bao-ton-kho
        [HttpGet("canh-bao-ton-kho")]
        public async Task<IActionResult> GetCanhBaoTonKho()
        {
            var result = await _adminService.GetDanhSachCanhBaoTonKhoAsync();
            return Ok(result);
        }

        // ══════════════════════════════════════════
        // HELPERS
        // ══════════════════════════════════════════

        private int GetCurrentUserId()
        {
            var userIdStr = HttpContext.Session.GetString("UserId");
            return int.TryParse(userIdStr, out var id) ? id : 0;
        }

        private string? GetClientIP()
        {
            return HttpContext.Connection.RemoteIpAddress?.ToString();
        }
    }
}
