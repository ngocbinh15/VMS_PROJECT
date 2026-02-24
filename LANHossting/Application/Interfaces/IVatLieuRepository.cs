using LANHossting.Application.DTOs;

namespace LANHossting.Application.Interfaces
{
    /// <summary>
    /// Repository interface for VatLieu write + lookup operations.
    /// </summary>
    public interface IVatLieuRepository
    {
        /// <summary>
        /// Check if a VatLieu exists by exact MaVatLieu OR case-insensitive TenVatLieu.
        /// </summary>
        Task<bool> ExistsAsync(string maVatLieu, string tenVatLieu);

        /// <summary>
        /// Insert a new VatLieu into DB and create TonKho record ONLY for dto.KhoId.
        /// </summary>
        Task CreateAsync(CreateVatLieuDto dto);

        /// <summary>
        /// Get all NhomVatLieu for dropdown.
        /// </summary>
        Task<List<DropdownItemDto>> GetNhomVatLieuAsync();

        /// <summary>
        /// Get all DonViTinh for dropdown.
        /// </summary>
        Task<List<DropdownItemDto>> GetDonViTinhAsync();
    }
}
