using LANHossting.Application.DTOs;

namespace LANHossting.Application.Interfaces
{
    /// <summary>
    /// Service interface for inventory transactions.
    /// Validates business rules before delegating to IGiaoDichRepository.
    /// </summary>
    public interface IGiaoDichService
    {
        /// <summary>
        /// Validate and execute a batch of inventory transactions.
        /// Business rules:
        ///   - KhoId must be valid
        ///   - Each item must have valid LoaiPhieu (NHAP/XUAT/DIEUCHUYEN)
        ///   - SoLuong > 0
        ///   - DIEUCHUYEN requires KhoNhanId != KhoId
        /// </summary>
        Task<ServiceResult> ExecuteAsync(GiaoDichBatchDto batch, int taiKhoanId, int phienLamViecId);
    }
}
