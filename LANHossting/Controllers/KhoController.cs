using Microsoft.AspNetCore.Mvc;
using LANHossting.Filters;

namespace LANHossting.Controllers
{
    /// <summary>
    /// MVC controller — renders views only.
    /// No DbContext. No ViewBag for data. No business logic.
    /// All data loading happens via API calls from JavaScript.
    /// </summary>
    [AuthorizeRole("ADMIN", "NHAN_VIEN_KHO")]
    public class KhoController : Controller
    {
        // GET: /Kho/Dashboard
        public IActionResult Dashboard()
        {
            return View();
        }
    }
}
