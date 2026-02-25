using LANHossting.Application.DTOs;

namespace LANHossting.Application.Interfaces
{
    /// <summary>
    /// Service cho nhật ký hệ thống — wrapper trên ISystemLogRepository.
    /// </summary>
    public interface ISystemLogService
    {
        Task<PagedResult<SystemLogItemDto>> GetLogsAsync(SystemLogFilterDto filter);
        Task WriteLogAsync(int taiKhoanId, string hanhDong, string doiTuong, int? doiTuongId, string? moTa, string? ip);
    }
}
