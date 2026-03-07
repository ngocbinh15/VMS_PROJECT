using LANHossting.Application.DTOs.Buoy;
using LANHossting.Application.Interfaces.Buoy;
using LANHossting.Filters;
using Microsoft.AspNetCore.Mvc;

namespace LANHossting.Controllers
{
    [Route("api/admin-phao")]
    [ApiController]
    [AuthorizeRole("ADMIN")]
    public class AdminPhaoAPIController : ControllerBase
    {
        private readonly IAdminPhaoService _svc;
        public AdminPhaoAPIController(IAdminPhaoService svc) => _svc = svc;

        private string? CurrentUser => HttpContext.Session.GetString("HoTen");

        // ═══ STATS ═══
        [HttpGet("thong-ke")]
        public async Task<IActionResult> ThongKe() =>
            Ok(await _svc.GetThongKeAsync());

        // ═══ DmTinhThanhPho ═══
        [HttpGet("tinh-thanh")]
        public async Task<IActionResult> DsTinhThanh() =>
            Ok(await _svc.GetAllTinhThanhAsync());

        [HttpPost("tinh-thanh")]
        public async Task<IActionResult> SaveTinhThanh([FromBody] SaveTinhThanhPhoDto dto, [FromQuery] int? id)
        {
            var (ok, err, outId) = await _svc.SaveTinhThanhAsync(id, dto, CurrentUser);
            return ok ? Ok(new { id = outId }) : BadRequest(new { error = err });
        }

        // ═══ DmDonVi ═══
        [HttpGet("don-vi")]
        public async Task<IActionResult> DsDonVi() =>
            Ok(await _svc.GetAllDonViAsync());

        [HttpPost("don-vi")]
        public async Task<IActionResult> SaveDonVi([FromBody] SaveDonViDto dto, [FromQuery] int? id)
        {
            var (ok, err, outId) = await _svc.SaveDonViAsync(id, dto, CurrentUser);
            return ok ? Ok(new { id = outId }) : BadRequest(new { error = err });
        }

        // ═══ DmTramQuanLy ═══
        [HttpGet("tram")]
        public async Task<IActionResult> DsTram() =>
            Ok(await _svc.GetAllTramAsync());

        [HttpPost("tram")]
        public async Task<IActionResult> SaveTram([FromBody] SaveTramQuanLyDto dto, [FromQuery] int? id)
        {
            var (ok, err, outId) = await _svc.SaveTramAsync(id, dto, CurrentUser);
            return ok ? Ok(new { id = outId }) : BadRequest(new { error = err });
        }

        // ═══ DmTuyenLuong ═══
        [HttpGet("tuyen-luong")]
        public async Task<IActionResult> DsTuyenLuong() =>
            Ok(await _svc.GetAllTuyenLuongAsync());

        [HttpPost("tuyen-luong")]
        public async Task<IActionResult> SaveTuyenLuong([FromBody] SaveTuyenLuongDto dto, [FromQuery] int? id)
        {
            var (ok, err, outId) = await _svc.SaveTuyenLuongAsync(id, dto, CurrentUser);
            return ok ? Ok(new { id = outId }) : BadRequest(new { error = err });
        }

        // ═══ DmViTriPhaoBH ═══
        [HttpGet("vi-tri")]
        public async Task<IActionResult> DsViTri([FromQuery] int tuyenLuongId)
        {
            if (tuyenLuongId <= 0) return BadRequest(new { error = "Phải chọn tuyến luồng" });
            return Ok(await _svc.GetViTriByTuyenLuongAsync(tuyenLuongId));
        }

        [HttpPost("vi-tri")]
        public async Task<IActionResult> SaveViTri([FromBody] SaveViTriPhaoBHDto dto, [FromQuery] int? id)
        {
            var (ok, err, outId) = await _svc.SaveViTriAsync(id, dto, CurrentUser);
            return ok ? Ok(new { id = outId }) : BadRequest(new { error = err });
        }
    }
}
