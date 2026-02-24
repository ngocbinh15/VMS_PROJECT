using LANHossting.Application.DTOs;

namespace LANHossting.Application.Interfaces
{
    /// <summary>
    /// Service interface for VatLieu operations.
    /// Contains business rules: duplicate check, default MucToiThieu, validation.
    /// </summary>
    public interface IVatLieuService
    {
        /// <summary>
        /// Create a new VatLieu with full validation:
        /// - Required field checks
        /// - DonGia >= 0
        /// - Duplicate check (MaVatLieu exact OR TenVatLieu case-insensitive)
        /// - Default MucToiThieu = 5 if null/empty
        /// </summary>
        Task<ServiceResult> CreateVatLieuAsync(CreateVatLieuDto dto);

        /// <summary>
        /// Get NhomVatLieu dropdown data.
        /// </summary>
        Task<List<DropdownItemDto>> GetNhomVatLieuAsync();

        /// <summary>
        /// Get DonViTinh dropdown data.
        /// </summary>
        Task<List<DropdownItemDto>> GetDonViTinhAsync();
    }
}
