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
        /// <summary>
        /// Thêm bản ghi mới vào LichSuHoatDongPhao
        /// </summary>
        Task AddLichSuHoatDongAsync(LichSuHoatDongPhao record);

        /// <summary>
        /// Lấy thông tin DmViTriPhaoBH kèm TuyenLuong (dùng cho snapshot lịch sử)
        /// </summary>
        Task<DmViTriPhaoBH?> GetViTriByIdAsync(int id);

        /// <summary>
        /// Lấy toàn bộ LichSuHoatDongPhao theo tuyến luồng (hoặc tất cả nếu null)
        /// Kèm navigation ViTriPhaoBH → TuyenLuong và Phao
        /// </summary>
        Task<List<LichSuHoatDongPhao>> GetLichSuHoatDongByTuyenAsync(int? tuyenLuongId);

        /// <summary>
        /// Kiểm tra vị trí đã có phao khác đang "Trên luồng" chưa (trừ phao hiện tại).
        /// Trả về MaPhaoDayDu của phao trùng, hoặc null nếu không trùng.
        /// </summary>
        Task<string?> CheckViTriTrungAsync(int viTriId, int excludePhaoId);

        /// <summary>
        /// Thêm phao mới vào DB
        /// </summary>
        Task AddPhaoAsync(Phao phao);

        /// <summary>
        /// Kiểm tra mã phao đã tồn tại chưa
        /// </summary>
        Task<bool> ExistsByMaPhaoAsync(string maPhaoDayDu);

        /// <summary>
        /// Kiểm tra tên phao đã tồn tại chưa
        /// </summary>
        Task<bool> ExistsByTenPhaoAsync(string tenPhao);

        /// <summary>
        /// Kiểm tra ký hiệu tài sản đã tồn tại chưa (trừ phao có Id = excludeId nếu có)
        /// </summary>
        Task<bool> ExistsByKyHieuTaiSanAsync(string kyHieu, int? excludeId = null);

        /// <summary>
        /// Lấy bản ghi lịch sử gần nhất (NgayBatDau &lt;= thoiDiem) cho mỗi phao.
        /// Kèm navigation ViTriPhaoBH → TuyenLuong.
        /// Dùng để hiển thị trạng thái phao tại một thời điểm quá khứ.
        /// </summary>
        Task<List<LichSuHoatDongPhao>> GetLatestStatusBeforeTimeAsync(DateTime thoiDiem);
    }
}
