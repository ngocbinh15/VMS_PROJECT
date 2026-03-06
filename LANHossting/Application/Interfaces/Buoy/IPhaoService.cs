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
        /// Lấy danh sách phao hiển thị trong bảng (có search/filter + filter theo tuyến luồng)
        /// </summary>
        Task<List<PhaoListItemDto>> GetDanhSachPhaoAsync(string? searchTerm = null, int? tuyenLuongId = null);

        /// <summary>
        /// Lấy chi tiết 1 phao
        /// </summary>
        Task<PhaoChiTietDto?> GetChiTietPhaoAsync(int id);

        /// <summary>
        /// Lấy danh sách tuyến luồng
        /// </summary>
        Task<List<TuyenLuongDto>> GetDanhSachTuyenLuongAsync();

        /// <summary>
        /// Cập nhật thông tin phao
        /// </summary>
        Task<(bool Success, string? Error)> CapNhatPhaoAsync(PhaoEditDto dto);

        /// <summary>
        /// Xóa phao theo Id (cascade xóa bản ghi liên quan)
        /// </summary>
        Task<(bool Success, string? Error)> XoaPhaoAsync(int id);

        /// <summary>
        /// Lấy dữ liệu vòng đời phao cho Flow Diagram (theo tuyến luồng)
        /// </summary>
        Task<VongDoiResponseDto> GetVongDoiPhaoAsync(int? tuyenLuongId);

        /// <summary>
        /// Lấy danh sách phao cho bảng điều phối.
        /// Nếu thoiDiem != null → hiển thị trạng thái phao TẠI thời điểm đó (event-based).
        /// Nếu thoiDiem == null → hiển thị trạng thái hiện tại (mặc định).
        /// </summary>
        Task<List<DieuPhoiPhaoRowDto>> GetDanhSachDieuPhoiAsync(string? search, int? tuyenLuongId, DateTime? thoiDiem = null);

        /// <summary>
        /// Thực hiện điều phối phao (cập nhật trạng thái + ghi lịch sử)
        /// </summary>
        Task<(bool Success, string? Error, int Count)> DieuPhoiPhaoAsync(DieuPhoiRequestDto request);

        /// <summary>
        /// Thêm phao mới vào hệ thống. Kiểm tra trùng mã và tên phao.
        /// Trạng thái ban đầu = Thu hồi.
        /// </summary>
        Task<(bool Success, string? Error)> ThemPhaoAsync(PhaoEditDto dto);
    }
}
