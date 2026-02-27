using LANHossting.Application.DTOs.Buoy;

namespace LANHossting.Application.Interfaces.Buoy
{
    /// <summary>
    /// Service layer cho module Phao.
    /// Chứa business logic, mapping DTO, tổng hợp data.
    /// </summary>
    public interface IPhaoService
    {
        /// <summary>
        /// Lấy thống kê tổng quan số lượng phao cho Dashboard
        /// </summary>
        Task<PhaoThongKeDto> GetThongKeAsync();

        /// <summary>
        /// Lấy danh sách phao hiển thị trong bảng (có search/filter)
        /// </summary>
        Task<List<PhaoListItemDto>> GetDanhSachPhaoAsync(string? searchTerm = null);

        /// <summary>
        /// Lấy chi tiết 1 phao
        /// </summary>
        Task<PhaoChiTietDto?> GetChiTietPhaoAsync(int id);

        /// <summary>
        /// Lấy danh sách tuyến luồng
        /// </summary>
        Task<List<TuyenLuongDto>> GetDanhSachTuyenLuongAsync();
    }
}
