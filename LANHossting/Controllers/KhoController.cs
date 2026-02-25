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
        private readonly ILogger<KhoController> _logger;

        public KhoController(ILogger<KhoController> logger)
        {
            _logger = logger;
        }

        // GET: /Kho/Dashboard
        public IActionResult Dashboard()
        {
            _logger.LogInformation("[KhoController] Dashboard hit — User: {User}, IsAuthenticated: {IsAuth}, Role: {Role}",
                HttpContext.Session.GetString("Username"),
                !string.IsNullOrEmpty(HttpContext.Session.GetString("UserId")),
                HttpContext.Session.GetString("Role"));
            return View();
        }
    }
}
