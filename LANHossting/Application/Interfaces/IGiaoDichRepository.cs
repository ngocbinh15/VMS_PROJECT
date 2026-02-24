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
    }
}
