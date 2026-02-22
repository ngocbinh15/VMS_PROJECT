using Microsoft.AspNetCore.Mvc;
using LANHossting.Filters;

namespace LANHossting.Controllers
{
    [AuthorizeRole("ADMIN", "NHAN_VIEN_KHO")]
    public class KhoController : Controller
    {
        // GET: /Kho/Dashboard - Trang chính quản lý kho
        public IActionResult Dashboard()
        {
            ViewBag.FullName = HttpContext.Session.GetString("HoTen");
            ViewBag.Username = HttpContext.Session.GetString("Username");
            ViewBag.Role = HttpContext.Session.GetString("RoleName");
            ViewBag.UserId = HttpContext.Session.GetString("UserId");
            return View();
        }
    }
}
