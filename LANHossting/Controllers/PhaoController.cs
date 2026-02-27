using Microsoft.AspNetCore.Mvc;
using LANHossting.Filters;
using LANHossting.Application.Interfaces.Buoy;
using LANHossting.Application.DTOs.Buoy;
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
        public async Task<IActionResult> Dashboard(string? search, int? tuyenLuongId)
        {
            var thongKe = await _phaoService.GetThongKeAsync();
            var danhSach = await _phaoService.GetDanhSachPhaoAsync(search, tuyenLuongId);
            var tuyenLuong = await _phaoService.GetDanhSachTuyenLuongAsync();

            var viewModel = new PhaoIndexViewModel
            {
                ThongKe = thongKe,
                DanhSachPhao = danhSach,
                DanhSachTuyenLuong = tuyenLuong,
                SearchTerm = search,
                SelectedTuyenLuongId = tuyenLuongId,
                FullName = HttpContext.Session.GetString("HoTen"),
                Username = HttpContext.Session.GetString("Username"),
                Role = HttpContext.Session.GetString("RoleName")
            };

            return View(viewModel);
        }

        /// <summary>
        /// GET: /Phao/DanhSach (AJAX) — trả JSON danh sách phao đã filter
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> DanhSach(string? search, int? tuyenLuongId)
        {
            var danhSach = await _phaoService.GetDanhSachPhaoAsync(search, tuyenLuongId);
            var thongKe = await _phaoService.GetThongKeAsync();
            return Json(new { items = danhSach, thongKe });
        }

        /// <summary>
        /// GET: /Phao/ChiTiet/{id} — chi tiết phao (JSON) cho modal xem/edit
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
        /// POST: /Phao/CapNhat — cập nhật thông tin phao
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CapNhat([FromBody] PhaoEditDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return Json(new { success = false, error = string.Join("; ", errors) });
            }

            var (success, error) = await _phaoService.CapNhatPhaoAsync(dto);
            return Json(new { success, error });
        }

        /// <summary>
        /// POST: /Phao/Xoa/{id} — xóa phao (cascade xóa bản ghi liên quan)
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Xoa(int id)
        {
            var (success, error) = await _phaoService.XoaPhaoAsync(id);
            return Json(new { success, error });
        }

        /// <summary>
        /// GET: /Phao/DieuPhoi
        /// </summary>
        public IActionResult DieuPhoi()
        {
            ViewBag.FullName = HttpContext.Session.GetString("HoTen");
            return View();
        }

        /// <summary>
        /// GET: /Phao/LichSu
        /// </summary>
        public IActionResult LichSu()
        {
            ViewBag.FullName = HttpContext.Session.GetString("HoTen");
            return View();
        }
    }
}
