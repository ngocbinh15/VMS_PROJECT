using LANHossting.Application.DTOs.Buoy;

namespace LANHossting.ViewModels.Buoy
{
    /// <summary>
    /// ViewModel cho trang chủ quản lý phao (Dashboard + Danh sách)
    /// </summary>
    public class PhaoIndexViewModel
    {
        /// <summary>
        /// Thống kê tổng quan (4 card ở đầu trang)
        /// </summary>
        public PhaoThongKeDto ThongKe { get; set; } = new();

        /// <summary>
        /// Danh sách phao hiển thị trong bảng
        /// </summary>
        public List<PhaoListItemDto> DanhSachPhao { get; set; } = new();

        /// <summary>
        /// Danh sách tuyến luồng (cho dropdown filter & chức năng điều phối)
        /// </summary>
        public List<TuyenLuongDto> DanhSachTuyenLuong { get; set; } = new();

        /// <summary>
        /// Từ khóa tìm kiếm hiện tại
        /// </summary>
        public string? SearchTerm { get; set; }

        /// <summary>
        /// Tuyến luồng đang được lọc
        /// </summary>
        public int? SelectedTuyenLuongId { get; set; }

        /// <summary>
        /// Thông tin user hiện tại
        /// </summary>
        public string? FullName { get; set; }
        public string? Username { get; set; }
        public string? Role { get; set; }
    }
}
