using LANHossting.Application.DTOs.Buoy;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace LANHossting.ViewModels.Buoy
{
    /// <summary>
    /// ViewModel cho trang Chi tiết Phao (readonly)
    /// </summary>
    public class PhaoChiTietViewModel
    {
        public PhaoChiTietDto Phao { get; set; } = new();
    }

    /// <summary>
    /// ViewModel cho trang Sửa Phao (form)
    /// </summary>
    public class PhaoEditViewModel
    {
        public PhaoEditDto Phao { get; set; } = new();

        // Dropdown data
        public List<SelectListItem> DanhSachViTri { get; set; } = new();
        public List<SelectListItem> DanhSachTramQuanLy { get; set; } = new();
        public List<SelectListItem> DanhSachTinhThanhPho { get; set; } = new();
        public List<SelectListItem> DanhSachDonVi { get; set; } = new();
        public List<SelectListItem> DanhSachTuyenLuong { get; set; } = new();
    }
}
