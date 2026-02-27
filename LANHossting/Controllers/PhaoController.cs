using Microsoft.AspNetCore.Mvc;
using LANHossting.Filters;
using LANHossting.Application.Interfaces.Buoy;
using LANHossting.ViewModels.Buoy;

namespace LANHossting.Controllers
{
    [AuthorizeRole("ADMIN", "NHAN_VIEN_PHAO")]
    public class PhaoController : Controller
    {
        private readonly IPhaoService _phaoService;

        public PhaoController(IPhaoService phaoService)
        {
            _phaoService = phaoService;
        }

        /// <summary>
        /// GET: /Phao/Dashboard
        /// Trang chủ quản lý phao — hiển thị thống kê + danh sách phao từ DB
        /// </summary>
        public async Task<IActionResult> Dashboard(string? search)
        {
            var thongKe = await _phaoService.GetThongKeAsync();
            var danhSach = await _phaoService.GetDanhSachPhaoAsync(search);
            var tuyenLuong = await _phaoService.GetDanhSachTuyenLuongAsync();

            var viewModel = new PhaoIndexViewModel
            {
                ThongKe = thongKe,
                DanhSachPhao = danhSach,
                DanhSachTuyenLuong = tuyenLuong,
                SearchTerm = search,
                FullName = HttpContext.Session.GetString("HoTen"),
                Username = HttpContext.Session.GetString("Username"),
                Role = HttpContext.Session.GetString("RoleName")
            };

            return View(viewModel);
        }

        /// <summary>
        /// GET: /Phao/ChiTiet/{id}
        /// API trả về chi tiết phao (JSON) cho modal
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ChiTiet(int id)
        {
            var chiTiet = await _phaoService.GetChiTietPhaoAsync(id);
            if (chiTiet == null)
                return NotFound();

            return Json(chiTiet);
        }

        /// <summary>
        /// GET: /Phao/DieuPhoi
        /// Placeholder cho chức năng Điều phối / Phân luồng (tương lai)
        /// </summary>
        public IActionResult DieuPhoi()
        {
            ViewBag.FullName = HttpContext.Session.GetString("HoTen");
            return View();
        }

        /// <summary>
        /// GET: /Phao/LichSu
        /// Placeholder cho chức năng Lịch sử hoạt động (tương lai)
        /// </summary>
        public IActionResult LichSu()
        {
            ViewBag.FullName = HttpContext.Session.GetString("HoTen");
            return View();
        }
    }
}
