using LANHossting.Application.DTOs;
using LANHossting.Application.Interfaces;

namespace LANHossting.Application.Services
{
    /// <summary>
    /// Nhật Ký service — pure pass-through to repository.
    /// No business logic needed for read operations.
    /// </summary>
    public class NhatKyService : INhatKyService
    {
        private readonly INhatKyRepository _repository;

        public NhatKyService(INhatKyRepository repository)
        {
            _repository = repository;
        }

        public async Task<PagedResult<NhatKyPhieuDto>> GetDanhSachPhieuAsync(NhatKyFilterDto filter)
        {
            // Sanitize pagination
            if (filter.Page < 1) filter.Page = 1;
            if (filter.PageSize < 1) filter.PageSize = 20;
            if (filter.PageSize > 100) filter.PageSize = 100;

            return await _repository.GetDanhSachPhieuAsync(filter);
        }

        public async Task<NhatKyPhieuHeaderDto?> GetChiTietPhieuAsync(int phieuId)
        {
            if (phieuId <= 0) return null;
            return await _repository.GetChiTietPhieuAsync(phieuId);
        }
    }
}
