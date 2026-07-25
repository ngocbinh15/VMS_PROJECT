using LANHossting.Application.DTOs;

namespace LANHossting.Application.Interfaces
{
    /// <summary>
    /// Repository interface for transactional inventory operations.
    /// All mutations (nhập/xuất/điều chuyển) run inside EF Core transactions.
    /// 
    /// PRICING RULE: VatLieu.DonGia is the single source of truth.
    /// On nhập kho with user-provided đơn giá > 0 → updates VatLieu.DonGia.
    /// </summary>
    public interface IGiaoDichRepository
    {
        /// <summary>
        /// Execute a batch of inventory transactions atomically.
        /// Creates PhieuNhapXuat, ChiTietPhieuNhapXuat, updates TonKho, logs LichSuVatLieu.
        /// All within a single DB transaction — rolls back entirely on any failure.
        /// </summary>
        Task<ServiceResult> ExecuteBatchAsync(GiaoDichBatchDto batch, int taiKhoanId, int phienLamViecId);

        /// <summary>
        /// Lấy danh sách tất cả các phiếu giao dịch đang ở trạng thái CHO_DUYET.
        /// </summary>
        Task<List<PhieuChoDuyetDto>> GetDanhSachPhieuChoDuyetAsync();

        /// <summary>
        /// Admin phê duyệt phiếu: Cập nhật tồn kho và đổi trạng thái phiếu sang HOAN_THANH.
        /// </summary>
        Task<ServiceResult> DuyetPhieuAsync(int phieuId, int nguoiDuyetId, int phienLamViecId);

        /// <summary>
        /// Admin từ chối phiếu: Đổi trạng thái phiếu sang TU_CHOI (giữ nguyên tồn kho).
        /// </summary>
        Task<ServiceResult> TuChoiPhieuAsync(int phieuId, int nguoiDuyetId, string? lyDo);

        /// <summary>
        /// Admin hoàn tác phiếu đã duyệt: Đảo ngược tồn kho và đổi trạng thái sang DA_HOAN_TAC.
        /// </summary>
        Task<ServiceResult> RollbackPhieuAsync(int phieuId, int nguoiRollbackId, int phienLamViecId, string? lyDo);
    }
}
