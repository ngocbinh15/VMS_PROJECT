using LANHossting.Application.DTOs;
using LANHossting.Application.Interfaces;

namespace LANHossting.Application.Services
{
    /// <summary>
    /// Application service for inventory operations.
    /// Delegates all data access to ITonKhoRepository.
    /// Contains ZERO price derivation logic.
    /// </summary>
    public class TonKhoService : ITonKhoService
    {
        private readonly ITonKhoRepository _repository;

        public TonKhoService(ITonKhoRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<TonKhoItemDto>> GetTonKhoAsync(int khoId, string? search = null)
        {
            return await _repository.GetTonKhoByKhoIdAsync(khoId, search);
        }

        public async Task<DashboardThongKeDto> GetDashboardThongKeAsync(int? khoId = null)
        {
            return await _repository.GetDashboardThongKeAsync(khoId);
        }

        public async Task<List<KhoDto>> GetDanhSachKhoAsync()
        {
            return await _repository.GetDanhSachKhoAsync();
        }
    }
}
