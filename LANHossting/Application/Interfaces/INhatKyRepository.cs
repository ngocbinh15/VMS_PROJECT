using LANHossting.Application.DTOs;

namespace LANHossting.Application.Interfaces
{
    /// <summary>
    /// Repository interface for Nhật Ký (audit log) read operations.
    /// All data sourced from LichSuVatLieu + PhieuNhapXuat + related tables.
    /// ZERO write operations — writing is handled by GiaoDichRepository.
    /// </summary>
    public interface INhatKyRepository
    {
        /// <summary>
        /// List PhieuNhapXuat records with status "Hoàn thành", paginated + filtered.
        /// </summary>
        Task<PagedResult<NhatKyPhieuDto>> GetDanhSachPhieuAsync(NhatKyFilterDto filter);

        /// <summary>
        /// Get full detail for a specific PhieuNhapXuat,
        /// including all LichSuVatLieu records linked to it.
        /// </summary>
        Task<NhatKyPhieuHeaderDto?> GetChiTietPhieuAsync(int phieuId);
    }
}
