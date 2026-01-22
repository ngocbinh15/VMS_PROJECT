using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace LANHossting.Filters
{
    /// <summary>
    /// Attribute để kiểm tra authentication và authorization
    /// Sử dụng: [AuthorizeRole] hoặc [AuthorizeRole("ADMIN", "NHAN_VIEN_KHO")]
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
    public class AuthorizeRoleAttribute : Attribute, IAuthorizationFilter
    {
        private readonly string[] _allowedRoles;

        public AuthorizeRoleAttribute(params string[] allowedRoles)
        {
            _allowedRoles = allowedRoles;
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var httpContext = context.HttpContext;
            
            // Kiểm tra đã đăng nhập chưa
            var userId = httpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userId))
            {
                // Chưa đăng nhập -> redirect về trang login
                context.Result = new RedirectToActionResult("Index", "Login", null);
                return;
            }

            // Nếu không chỉ định role cụ thể, chỉ cần đã login là được
            if (_allowedRoles == null || _allowedRoles.Length == 0)
            {
                return;
            }

            // Kiểm tra role
            var userRole = httpContext.Session.GetString("Role");
            if (string.IsNullOrEmpty(userRole) || !_allowedRoles.Contains(userRole))
            {
                // Không có quyền truy cập
                context.Result = new ForbidResult();
            }
        }
    }

    /// <summary>
    /// Attribute chỉ cho phép truy cập khi chưa đăng nhập
    /// Dùng cho trang Login để tránh user đã login vào lại trang login
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class GuestOnlyAttribute : Attribute, IAuthorizationFilter
    {
        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var httpContext = context.HttpContext;
            var userId = httpContext.Session.GetString("UserId");
            
            if (!string.IsNullOrEmpty(userId))
            {
                // Đã đăng nhập -> redirect về dashboard tương ứng
                var role = httpContext.Session.GetString("Role");
                var redirectUrl = GetDashboardUrl(role ?? "");
                context.Result = new RedirectResult(redirectUrl);
            }
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
    }
}
