using Microsoft.AspNetCore.Mvc;
using LANHossting.Filters;

namespace LANHossting.Controllers
{
    [AuthorizeRole("ADMIN")]
    public class AdminController : Controller
    {
        // GET: /Admin/Dashboard
        public IActionResult Dashboard()
        {
            ViewBag.FullName = HttpContext.Session.GetString("HoTen");
            ViewBag.Username = HttpContext.Session.GetString("Username");
            ViewBag.Role = HttpContext.Session.GetString("RoleName");
            return View();
        }

        // GET: /Admin/QuanLyPhao
        public IActionResult QuanLyPhao()
        {
            ViewBag.FullName = HttpContext.Session.GetString("HoTen");
            return View();
        }

        // GET: /Admin/QuanLyKho
        public IActionResult QuanLyKho()
        {
            ViewBag.FullName = HttpContext.Session.GetString("HoTen");
            return View();
        }
    }
}
