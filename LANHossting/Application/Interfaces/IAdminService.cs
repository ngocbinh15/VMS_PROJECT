using LANHossting.Application.DTOs;

namespace LANHossting.Application.Interfaces
{
    /// <summary>
    /// Service cho Admin — quản trị tài khoản, vật liệu.
    /// Orchestrates repository + business rules + system logging.
    /// </summary>
    public interface IAdminService
    {
        // ── TÀI KHOẢN ──
        Task<List<TaiKhoanListDto>> GetDanhSachTaiKhoanAsync();
        Task<ServiceResult> CreateTaiKhoanAsync(CreateTaiKhoanDto dto, int nguoiTaoId, string? ip);
        Task<ServiceResult> UpdateTaiKhoanAsync(UpdateTaiKhoanDto dto, int nguoiThucHienId, string? ip);
        Task<ServiceResult> DeleteTaiKhoanAsync(int id, int nguoiThucHienId, string? ip);
        Task<ServiceResult> ToggleTrangThaiAsync(int id, int nguoiThucHienId, string? ip);
        Task<ServiceResult> ResetPasswordAsync(ResetPasswordDto dto, int nguoiThucHienId, string? ip);

        // ── VAI TRÒ ──
        Task<List<VaiTroDropdownDto>> GetDanhSachVaiTroAsync();

        // ── VẬT LIỆU ──
        Task<List<VatLieuListDto>> GetDanhSachVatLieuAsync();
        Task<ServiceResult> UpdateVatLieuAsync(UpdateVatLieuDto dto, int nguoiThucHienId, string? ip);
        Task<ServiceResult> DeleteVatLieuAsync(int id, int nguoiThucHienId, string? ip);
    }
}
