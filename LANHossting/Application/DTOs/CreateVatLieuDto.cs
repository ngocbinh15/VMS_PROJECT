using System.ComponentModel.DataAnnotations;

namespace LANHossting.Application.DTOs
{
    /// <summary>
    /// DTO for creating a new VatLieu (material).
    /// Maps to VatLieu table — does NOT include TrangThai or MucToiDa (excluded by requirement).
    /// </summary>
    public class CreateVatLieuDto
    {
        [Required(ErrorMessage = "Mã vật tư là bắt buộc")]
        [MaxLength(50, ErrorMessage = "Mã vật tư tối đa 50 ký tự")]
        public string MaVatLieu { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tên vật tư là bắt buộc")]
        [MaxLength(200, ErrorMessage = "Tên vật tư tối đa 200 ký tự")]
        public string TenVatLieu { get; set; } = string.Empty;

        [Required(ErrorMessage = "Nhóm vật tư là bắt buộc")]
        public int? NhomVatLieuId { get; set; }

        [Required(ErrorMessage = "Đơn vị tính là bắt buộc")]
        public int DonViTinhId { get; set; }

        [Required(ErrorMessage = "Đơn giá là bắt buộc")]
        [Range(0, double.MaxValue, ErrorMessage = "Đơn giá phải >= 0")]
        public decimal DonGia { get; set; }

        [Required(ErrorMessage = "Kho là bắt buộc")]
        [Range(1, int.MaxValue, ErrorMessage = "Kho là bắt buộc")]
        public int KhoId { get; set; }

        public string? MoTa { get; set; }

        public string? QuyDinhBaoQuan { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Mức tối thiểu phải >= 0")]
        public decimal? MucToiThieu { get; set; }
    }

    /// <summary>
    /// Structured response for all mutation operations.
    /// </summary>
    public class ServiceResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<string> Errors { get; set; } = new();
    }

    /// <summary>
    /// Dropdown item for NhomVatLieu / DonViTinh selects.
    /// </summary>
    public class DropdownItemDto
    {
        public int Id { get; set; }
        public string Ma { get; set; } = string.Empty;
        public string Ten { get; set; } = string.Empty;
    }
}
