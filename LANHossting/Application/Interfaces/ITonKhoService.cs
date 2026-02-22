using LANHossting.Application.DTOs;

namespace LANHossting.Application.Interfaces
{
    /// <summary>
    /// Service interface for inventory operations.
    /// Delegates to ITonKhoRepository. No business logic derivation of price.
    /// </summary>
    public interface ITonKhoService
    {
        Task<List<TonKhoItemDto>> GetTonKhoAsync(int khoId, string? search = null);
        Task<DashboardThongKeDto> GetDashboardThongKeAsync(int? khoId = null);
        Task<List<KhoDto>> GetDanhSachKhoAsync();
    }
}
