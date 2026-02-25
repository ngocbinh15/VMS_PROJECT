using LANHossting.Application.DTOs;
using LANHossting.Application.Interfaces;

namespace LANHossting.Application.Services
{
    /// <summary>
    /// Service cho nhật ký hệ thống — thin wrapper trên ISystemLogRepository.
    /// </summary>
    public class SystemLogService : ISystemLogService
    {
        private readonly ISystemLogRepository _repository;

        public SystemLogService(ISystemLogRepository repository)
        {
            _repository = repository;
        }

        public async Task<PagedResult<SystemLogItemDto>> GetLogsAsync(SystemLogFilterDto filter)
        {
            // Defaults
            if (filter.Page <= 0) filter.Page = 1;
            if (filter.PageSize <= 0 || filter.PageSize > 100) filter.PageSize = 20;

            return await _repository.GetLogsAsync(filter);
        }

        public async Task WriteLogAsync(int taiKhoanId, string hanhDong, string doiTuong, int? doiTuongId, string? moTa, string? ip)
        {
            await _repository.WriteLogAsync(taiKhoanId, hanhDong, doiTuong, doiTuongId, moTa, ip);
        }
    }
}
