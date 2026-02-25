using LANHossting.Application.DTOs;

namespace LANHossting.Application.Interfaces
{
    /// <summary>
    /// Repository cho quản trị tài khoản + vật liệu (Admin module).
    /// </summary>
    public interface IAdminRepository
    {
        // ── TÀI KHOẢN ──
        Task<List<TaiKhoanListDto>> GetDanhSachTaiKhoanAsync();
        Task<TaiKhoanListDto?> GetTaiKhoanByIdAsync(int id);
        Task<bool> TenDangNhapExistsAsync(string tenDangNhap, int? excludeId = null);
        Task<int> CreateTaiKhoanAsync(CreateTaiKhoanDto dto, int nguoiTaoId);
        Task<bool> UpdateTaiKhoanAsync(UpdateTaiKhoanDto dto);
        Task<bool> DeleteTaiKhoanAsync(int id);
        Task<bool> ToggleTrangThaiAsync(int id); // Khóa / Mở khóa
        Task<bool> ResetPasswordAsync(int id, string newPassword);

        // ── VAI TRÒ ──
        Task<List<VaiTroDropdownDto>> GetDanhSachVaiTroAsync();

        // ── VẬT LIỆU ──
        Task<List<VatLieuListDto>> GetDanhSachVatLieuAsync();
        Task<bool> UpdateVatLieuAsync(UpdateVatLieuDto dto);
        Task<bool> DeleteVatLieuAsync(int id);
    }
}
