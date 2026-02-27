using LANHossting.Domain.Entities.Buoy;

namespace LANHossting.Application.Interfaces.Buoy
{
    /// <summary>
    /// Repository cho bảng Phao và các bảng liên quan.
    /// Chỉ chịu trách nhiệm truy vấn data, không có business logic.
    /// </summary>
    public interface IPhaoRepository
    {
        /// <summary>
        /// Đếm tổng số phao
        /// </summary>
        Task<int> CountAllAsync();

        /// <summary>
        /// Đếm phao đang trên luồng (LichSuHoatDongPhao.LoaiTrangThai = 'TREN_LUONG' AND NgayKetThuc IS NULL)
        /// </summary>
        Task<int> CountTrenLuongAsync();

        /// <summary>
        /// Đếm phao đang trên bãi / thu hồi
        /// </summary>
        Task<int> CountDuPhongAsync();

        /// <summary>
        /// Đếm phao sự cố
        /// </summary>
        Task<int> CountSuCoAsync();

        /// <summary>
        /// Lấy danh sách phao kèm trạng thái hiện tại (phục vụ bảng danh sách)
        /// </summary>
        Task<List<Phao>> GetAllWithCurrentStatusAsync();

        /// <summary>
        /// Lấy phao theo Id kèm navigation
        /// </summary>
        Task<Phao?> GetByIdAsync(int id);

        /// <summary>
        /// Lấy lịch sử bảo trì gần nhất của phao
        /// </summary>
        Task<DateTime?> GetNgaySuaChuaGanNhatAsync(int phaoId);

        /// <summary>
        /// Lấy lịch sử hoạt động hiện tại (NgayKetThuc IS NULL)
        /// </summary>
        Task<LichSuHoatDongPhao?> GetHoatDongHienTaiAsync(int phaoId);

        /// <summary>
        /// Lấy phao theo Id kèm navigation (TRACKED — dùng cho update)
        /// </summary>
        Task<Phao?> GetByIdForEditAsync(int id);

        /// <summary>
        /// Xóa phao kèm cascade xóa bản ghi liên quan (LichSu*, BaoTri, ThietBi)
        /// </summary>
        Task<bool> DeleteAsync(int id);

        /// <summary>
        /// Lưu thay đổi EF context
        /// </summary>
        Task SaveChangesAsync();
    }
}
