using Microsoft.AspNetCore.Mvc;
using LANHossting.Application.Interfaces;
using LANHossting.Filters;

namespace LANHossting.Controllers
{
    /// <summary>
    /// Thin API controller for warehouse inventory queries.
    /// Delegates all logic to ITonKhoService.
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

        public KhoAPIController(ITonKhoService tonKhoService)
        {
            _tonKhoService = tonKhoService;
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
    }
}
