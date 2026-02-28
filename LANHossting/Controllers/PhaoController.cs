using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using LANHossting.Filters;
using LANHossting.Application.Interfaces.Buoy;
using LANHossting.Application.DTOs.Buoy;
using LANHossting.ViewModels.Buoy;
using LANHossting.Data;

namespace LANHossting.Controllers
{
    [AuthorizeRole("ADMIN", "NHAN_VIEN_PHAO")]
    public class PhaoController : Controller
    {
        private readonly IPhaoService _phaoService;
        private readonly AppDbContext _context;

        public PhaoController(IPhaoService phaoService, AppDbContext context)
        {
            _phaoService = phaoService;
            _context = context;
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
        /// GET: /Phao/ChiTiet/{id} — trang chi tiết phao (Razor page)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ChiTiet(int id)
        {
            var chiTiet = await _phaoService.GetChiTietPhaoAsync(id);
            if (chiTiet == null)
                return NotFound();

            var viewModel = new PhaoChiTietViewModel { Phao = chiTiet };
            return View(viewModel);
        }

        /// <summary>
        /// GET: /Phao/ChiTietJson/{id} — chi tiết phao (JSON) cho modal xem
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ChiTietJson(int id)
        {
            var chiTiet = await _phaoService.GetChiTietPhaoAsync(id);
            if (chiTiet == null)
                return NotFound();

            return Json(chiTiet);
        }

        /// <summary>
        /// GET: /Phao/Edit/{id} — trang sửa phao (Razor page)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> Edit(int id)
        {
            var chiTiet = await _phaoService.GetChiTietPhaoAsync(id);
            if (chiTiet == null)
                return NotFound();

            var dto = MapChiTietToEditDto(chiTiet);
            var viewModel = new PhaoEditViewModel
            {
                Phao = dto,
                DanhSachViTri = await GetViTriSelectList(),
                DanhSachTramQuanLy = await GetTramQuanLySelectList(),
                DanhSachTinhThanhPho = await GetTinhThanhPhoSelectList(),
                DanhSachDonVi = await GetDonViSelectList(),
                DanhSachTuyenLuong = await GetTuyenLuongSelectList()
            };

            return View(viewModel);
        }

        /// <summary>
        /// POST: /Phao/Edit — cập nhật thông tin phao (form submit)
        /// </summary>
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(PhaoEditViewModel viewModel)
        {
            if (!ModelState.IsValid)
            {
                viewModel.DanhSachViTri = await GetViTriSelectList();
                viewModel.DanhSachTramQuanLy = await GetTramQuanLySelectList();
                viewModel.DanhSachTinhThanhPho = await GetTinhThanhPhoSelectList();
                viewModel.DanhSachDonVi = await GetDonViSelectList();
                viewModel.DanhSachTuyenLuong = await GetTuyenLuongSelectList();
                return View(viewModel);
            }

            var (success, error) = await _phaoService.CapNhatPhaoAsync(viewModel.Phao);
            if (!success)
            {
                ModelState.AddModelError("", error ?? "Lỗi không xác định");
                viewModel.DanhSachViTri = await GetViTriSelectList();
                viewModel.DanhSachTramQuanLy = await GetTramQuanLySelectList();
                viewModel.DanhSachTinhThanhPho = await GetTinhThanhPhoSelectList();
                viewModel.DanhSachDonVi = await GetDonViSelectList();
                viewModel.DanhSachTuyenLuong = await GetTuyenLuongSelectList();
                return View(viewModel);
            }

            TempData["SuccessMessage"] = "Cập nhật phao thành công!";
            return RedirectToAction("ChiTiet", new { id = viewModel.Phao.Id });
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

        /// <summary>
        /// GET: /Phao/GetViTriInfo/{id} — lấy tọa độ từ DmViTriPhaoBH (AJAX)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetViTriInfo(int id)
        {
            var viTri = await _context.DmViTriPhaoBH
                .AsNoTracking()
                .Where(v => v.Id == id)
                .Select(v => new { v.ToaDoThietKe, v.MaPhaoBH, TuyenLuong = v.TuyenLuong!.TenTuyen })
                .FirstOrDefaultAsync();

            if (viTri == null) return NotFound();
            return Json(viTri);
        }

        /// <summary>
        /// GET: /Phao/GetViTriByTuyenLuong/{tuyenLuongId} — danh sách vị trí theo tuyến (AJAX)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetViTriByTuyenLuong(int tuyenLuongId)
        {
            var list = await _context.DmViTriPhaoBH
                .AsNoTracking()
                .Where(v => v.TuyenLuongId == tuyenLuongId && v.TrangThai == "Hoạt động")
                .OrderBy(v => v.ThuTuHienThi)
                .Select(v => new { v.Id, v.MaPhaoBH, v.ToaDoThietKe })
                .ToListAsync();

            return Json(list);
        }

        #region Private Helpers

        private PhaoEditDto MapChiTietToEditDto(PhaoChiTietDto ct)
        {
            return new PhaoEditDto
            {
                Id = ct.Id,
                KyHieuTaiSan = ct.KyHieuTaiSan,
                MaPhaoDayDu = ct.MaPhaoDayDu,
                TenPhao = ct.TenPhao,
                SoPhaoHienTai = ct.SoPhaoHienTai,
                DuongKinhPhao = ct.DuongKinhPhao,
                ChieuCaoToanBo = ct.ChieuCaoToanBo,
                HinhDang = ct.HinhDang,
                VatLieu = ct.VatLieu,
                MauSac = ct.MauSac,
                ThoiGianSuDung = ct.ThoiGianSuDung,
                ThoiDiemThayTha = ct.ThoiDiemThayTha,
                ThoiDiemSuaChuaGanNhat = ct.ThoiDiemSuaChuaGanNhat,
                TrangThaiHienTai = ct.TrangThaiHienTai,
                ViTriPhaoBHHienTaiId = ct.ViTriPhaoBHHienTaiId,
                XichPhao_DuongKinh = ct.XichPhao_DuongKinh,
                XichPhao_ChieuDai = ct.XichPhao_ChieuDai,
                XichPhao_ThoiDiemSuDung = ct.XichPhao_ThoiDiemSuDung,
                XichRua_DuongKinh = ct.XichRua_DuongKinh,
                XichRua_ChieuDai = ct.XichRua_ChieuDai,
                XichRua_ThoiDiemSuDung = ct.XichRua_ThoiDiemSuDung,
                Rua_TrongLuong = ct.Rua_TrongLuong,
                Rua_ThoiDiemSuDung = ct.Rua_ThoiDiemSuDung,
                TramQuanLyId = ct.TramQuanLyId,
                TinhThanhPhoId = ct.TinhThanhPhoId,
                DonViQuanLyId = ct.DonViQuanLyId,
                DonViVanHanhId = ct.DonViVanHanhId,
                SoQuyetDinhTang = ct.SoQuyetDinhTang,
                NgayQuyetDinhTang = ct.NgayQuyetDinhTang,
                DienTich = ct.DienTich,
                Den_ChungLoai = ct.Den_ChungLoai,
                Den_KetNoiAIS = ct.Den_KetNoiAIS,
                Den_DacTinhAnhSang = ct.Den_DacTinhAnhSang,
                Den_ChieuXaTamSang = ct.Den_ChieuXaTamSang,
                Den_ChieuCaoTamSangHaiDo = ct.Den_ChieuCaoTamSangHaiDo,
                Den_NguonCapNangLuong = ct.Den_NguonCapNangLuong,
                Den_ThoiDiemSuDung = ct.Den_ThoiDiemSuDung,
                Den_ThoiDiemSuaChua = ct.Den_ThoiDiemSuaChua,
                Den_SoQuyetDinhTang = ct.Den_SoQuyetDinhTang
            };
        }

        private async Task<List<SelectListItem>> GetViTriSelectList()
        {
            var items = await _context.DmViTriPhaoBH
                .AsNoTracking()
                .Where(v => v.TrangThai == "Hoạt động")
                .Include(v => v.TuyenLuong)
                .OrderBy(v => v.TuyenLuong!.ThuTuHienThi).ThenBy(v => v.ThuTuHienThi)
                .ToListAsync();

            return items.Select(v => new SelectListItem
            {
                Value = v.Id.ToString(),
                Text = $"{v.MaPhaoBH} ({v.TuyenLuong?.TenTuyen})"
            }).ToList();
        }

        private async Task<List<SelectListItem>> GetTramQuanLySelectList()
        {
            return await _context.DmTramQuanLy
                .AsNoTracking()
                .Where(t => t.TrangThai == "Hoạt động")
                .OrderBy(t => t.ThuTuHienThi)
                .Select(t => new SelectListItem { Value = t.Id.ToString(), Text = t.TenTram })
                .ToListAsync();
        }

        private async Task<List<SelectListItem>> GetTinhThanhPhoSelectList()
        {
            return await _context.DmTinhThanhPho
                .AsNoTracking()
                .Where(t => t.TrangThai == "Hoạt động")
                .OrderBy(t => t.ThuTuHienThi)
                .Select(t => new SelectListItem { Value = t.Id.ToString(), Text = t.TenTinh })
                .ToListAsync();
        }

        private async Task<List<SelectListItem>> GetDonViSelectList()
        {
            return await _context.DmDonVi
                .AsNoTracking()
                .Where(d => d.TrangThai == "Hoạt động")
                .OrderBy(d => d.ThuTuHienThi)
                .Select(d => new SelectListItem { Value = d.Id.ToString(), Text = d.TenDonVi })
                .ToListAsync();
        }

        private async Task<List<SelectListItem>> GetTuyenLuongSelectList()
        {
            return await _context.DmTuyenLuong
                .AsNoTracking()
                .Where(t => t.TrangThai == "Hoạt động")
                .OrderBy(t => t.ThuTuHienThi)
                .Select(t => new SelectListItem { Value = t.Id.ToString(), Text = t.TenTuyen })
                .ToListAsync();
        }

        #endregion
    }
}
