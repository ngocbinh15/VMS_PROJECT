using Microsoft.AspNetCore.Mvc;
using LANHossting.Filters;

namespace LANHossting.Controllers
{
    [AuthorizeRole("ADMIN", "NHAN_VIEN_PHAO")]
    public class PhaoController : Controller
    {
        // GET: /Phao/Dashboard
        public IActionResult Dashboard()
        {
            ViewBag.FullName = HttpContext.Session.GetString("HoTen");
            ViewBag.Username = HttpContext.Session.GetString("Username");
            ViewBag.Role = HttpContext.Session.GetString("RoleName");
            return View();
        }
    }
}
