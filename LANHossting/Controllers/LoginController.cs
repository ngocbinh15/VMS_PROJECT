using Microsoft.AspNetCore.Mvc;
using LANHossting.Data;
using LANHossting.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace LANHossting.Controllers
{
    public class LoginController : Controller
    {
        private readonly AppDbContext _context;

        public LoginController(AppDbContext context)
        {
            _context = context;
        }

        // GET: /Login
        public IActionResult Index()
        {
            // Nếu đã đăng nhập, redirect về dashboard tương ứng
            if (HttpContext.Session.GetString("UserId") != null)
            {
                return RedirectToDashboard();
            }

            return View();
        }

        // POST: /Login/Authenticate
        [HttpPost]
        public async Task<IActionResult> Authenticate([FromBody] LoginRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
                {
                    return Json(new { success = false, message = "Vui lòng nhập đầy đủ thông tin!" });
                }

                // Tìm tài khoản trong database
                var taiKhoan = await _context.TaiKhoan
                    .Include(t => t.VaiTro)
                    .FirstOrDefaultAsync(t => 
                        t.TenDangNhap == request.Username && 
                        t.TrangThai == "Hoạt động");

                if (taiKhoan == null)
                {
                    return Json(new { success = false, message = "Tài khoản không tồn tại hoặc đã bị khóa!" });
                }

                // Kiểm tra mật khẩu (giả sử password đã được hash bằng SHA256)
                string hashedPassword = HashPassword(request.Password);
                if (taiKhoan.MatKhau != hashedPassword && taiKhoan.MatKhau != request.Password)
                {
                    return Json(new { success = false, message = "Mật khẩu không chính xác!" });
                }

                // Lưu thông tin vào Session
                HttpContext.Session.SetString("UserId", taiKhoan.Id.ToString());
                HttpContext.Session.SetString("Username", taiKhoan.TenDangNhap);
                HttpContext.Session.SetString("HoTen", taiKhoan.HoTen);
                HttpContext.Session.SetString("Role", taiKhoan.VaiTro.MaVaiTro);
                HttpContext.Session.SetString("RoleName", taiKhoan.VaiTro.TenVaiTro);

                // Tạo phiên làm việc
                var phienLamViec = new PhienLamViec
                {
                    TaiKhoanId = taiKhoan.Id,
                    ThoiGianDangNhap = DateTime.Now,
                    DiaChi_IP = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    ThietBi = HttpContext.Request.Headers["User-Agent"].ToString(),
                    TrangThai = "Đang hoạt động"
                };

                _context.PhienLamViec.Add(phienLamViec);
                await _context.SaveChangesAsync();

                HttpContext.Session.SetString("SessionId", phienLamViec.Id.ToString());

                // Xác định URL redirect dựa vào role
                string redirectUrl = GetDashboardUrl(taiKhoan.VaiTro.MaVaiTro);

                return Json(new { 
                    success = true, 
                    message = "Đăng nhập thành công!", 
                    redirectUrl = redirectUrl,
                    role = taiKhoan.VaiTro.MaVaiTro,
                    fullName = taiKhoan.HoTen
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Lỗi hệ thống: " + ex.Message });
            }
        }

        // GET: /Login/Logout
        public async Task<IActionResult> Logout()
        {
            try
            {
                // Cập nhật phiên làm việc
                var sessionId = HttpContext.Session.GetString("SessionId");
                if (!string.IsNullOrEmpty(sessionId))
                {
                    var phienLamViec = await _context.PhienLamViec
                        .FindAsync(int.Parse(sessionId));

                    if (phienLamViec != null)
                    {
                        phienLamViec.ThoiGianDangXuat = DateTime.Now;
                        phienLamViec.TrangThai = "Đã đăng xuất";
                        await _context.SaveChangesAsync();
                    }
                }

                // Xóa session
                HttpContext.Session.Clear();

                return RedirectToAction("Index");
            }
            catch
            {
                HttpContext.Session.Clear();
                return RedirectToAction("Index");
            }
        }

        // Helper Methods
        private IActionResult RedirectToDashboard()
        {
            var role = HttpContext.Session.GetString("Role");
            string url = GetDashboardUrl(role ?? "");
            return Redirect(url);
        }

        private string GetDashboardUrl(string role)
        {
            return role switch
            {
                "ADMIN" => "/Admin/Dashboard",
                "NHAN_VIEN_KHO" => "/Kho/Dashboard",
                "NHAN_VIEN_PHAO" => "/Phao/Dashboard",
                _ => "/Login/Index"
            };
        }

        private string HashPassword(string password)
        {
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                StringBuilder builder = new StringBuilder();
                foreach (byte b in bytes)
                {
                    builder.Append(b.ToString("x2"));
                }
                return builder.ToString();
            }
        }
    }

    // DTO cho Login Request
    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
