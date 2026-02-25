using LANHossting.Application.DTOs;

namespace LANHossting.Application.Interfaces
{
    /// <summary>
    /// Service interface for Nhật Ký (audit log) read operations.
    /// Thin layer — delegates to INhatKyRepository.
    /// </summary>
    public interface INhatKyService
    {
        Task<PagedResult<NhatKyPhieuDto>> GetDanhSachPhieuAsync(NhatKyFilterDto filter);
        Task<NhatKyPhieuHeaderDto?> GetChiTietPhieuAsync(int phieuId);
    }
}
