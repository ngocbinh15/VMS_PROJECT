using Microsoft.AspNetCore.Mvc;
using LANHossting.Application.Interfaces;
using LANHossting.Application.DTOs;
using LANHossting.Filters;

namespace LANHossting.Controllers
{
    /// <summary>
    /// Thin API controller for Admin module.
    /// Delegates ALL logic to IAdminService / ISystemLogService.
    /// Contains ZERO business logic, ZERO direct DbContext usage.
    /// </summary>
    [AuthorizeRole("ADMIN")]
    [Route("api/admin")]
    [ApiController]
    public class AdminAPIController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly ISystemLogService _logService;

        public AdminAPIController(IAdminService adminService, ISystemLogService logService)
        {
            _adminService = adminService;
            _logService = logService;
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
