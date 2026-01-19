using Microsoft.AspNetCore.Mvc;
using LANHossting.Data;
using LANHossting.Models;
using Microsoft.EntityFrameworkCore;

namespace LANHossting.Controllers
{
    public class TestDbController : Controller
    {
        private readonly AppDbContext _context;

        public TestDbController(AppDbContext context)
        {
            _context = context;
        }

        // Test kết nối database
        // URL: /TestDb/Index
        public async Task<IActionResult> Index()
        {
            try
            {
                // Kiểm tra kết nối
                var canConnect = await _context.Database.CanConnectAsync();
                ViewBag.ConnectionStatus = canConnect ? "Kết nối thành công!" : "Không thể kết nối!";

                // Lấy số lượng bản ghi từ các bảng
                ViewBag.SoLuongTuyenLuong = await _context.DmTuyenLuong.CountAsync();
                ViewBag.SoLuongPhao = await _context.Phao.CountAsync();
                ViewBag.SoLuongKho = await _context.Kho.CountAsync();
                ViewBag.SoLuongVatLieu = await _context.VatLieu.CountAsync();
                ViewBag.SoLuongTaiKhoan = await _context.TaiKhoan.CountAsync();

                return View();
            }
            catch (Exception ex)
            {
                ViewBag.ConnectionStatus = $"Lỗi: {ex.Message}";
                ViewBag.ErrorDetails = ex.ToString();
                return View();
            }
        }

        // Hiển thị danh sách tuyến luồng
        // URL: /TestDb/DanhSachTuyenLuong
        public async Task<IActionResult> DanhSachTuyenLuong()
        {
            var danhSach = await _context.DmTuyenLuong
                .OrderBy(t => t.ThuTuHienThi)
                .ToListAsync();
            return View(danhSach);
        }

        // Hiển thị danh sách kho
        // URL: /TestDb/DanhSachKho
        public async Task<IActionResult> DanhSachKho()
        {
            var danhSach = await _context.Kho
                .Include(k => k.KhoMe)
                .OrderBy(k => k.LoaiKho)
                .ThenBy(k => k.MaKho)
                .ToListAsync();
            return View(danhSach);
        }

        // Hiển thị danh sách phao
        // URL: /TestDb/DanhSachPhao
        public async Task<IActionResult> DanhSachPhao()
        {
            var danhSach = await _context.Phao
                .OrderBy(p => p.MaPhaoDayDu)
                .Take(50) // Giới hạn 50 bản ghi để test
                .ToListAsync();
            return View(danhSach);
        }

        // API: Lấy thông tin database
        // URL: /TestDb/GetDatabaseInfo
        [HttpGet]
        public async Task<IActionResult> GetDatabaseInfo()
        {
            try
            {
                var info = new
                {
                    Connected = await _context.Database.CanConnectAsync(),
                    DatabaseName = _context.Database.GetDbConnection().Database,
                    ConnectionString = _context.Database.GetConnectionString(),
                    Tables = new
                    {
                        TuyenLuong = await _context.DmTuyenLuong.CountAsync(),
                        ViTriPhao = await _context.DmViTriPhaoBH.CountAsync(),
                        Phao = await _context.Phao.CountAsync(),
                        VaiTro = await _context.VaiTro.CountAsync(),
                        TaiKhoan = await _context.TaiKhoan.CountAsync(),
                        Kho = await _context.Kho.CountAsync(),
                        VatLieu = await _context.VatLieu.CountAsync(),
                        TonKho = await _context.TonKho.CountAsync(),
                        PhieuNhapXuat = await _context.PhieuNhapXuat.CountAsync()
                    }
                };

                return Json(info);
            }
            catch (Exception ex)
            {
                return Json(new { error = ex.Message, details = ex.ToString() });
            }
        }
    }
}
