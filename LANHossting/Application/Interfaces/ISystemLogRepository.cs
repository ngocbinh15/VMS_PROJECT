using LANHossting.Application.DTOs;

namespace LANHossting.Application.Interfaces
{
    /// <summary>
    /// Repository cho nhật ký hệ thống (NhatKyHeThong).
    /// </summary>
    public interface ISystemLogRepository
    {
        Task<PagedResult<SystemLogItemDto>> GetLogsAsync(SystemLogFilterDto filter);
        Task WriteLogAsync(int taiKhoanId, string hanhDong, string doiTuong, int? doiTuongId, string? moTa, string? ip);
    }
}
