using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LANHossting.Models
{
    /// <summary>
    /// Nhật ký hệ thống — ghi lại mọi hành động quản trị của Admin.
    /// Bảng: NhatKyHeThong
    /// </summary>
    [Table("NhatKyHeThong")]
    public class NhatKyHeThong
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TaiKhoanId { get; set; }

        /// <summary>
        /// ActionType: TAO, SUA, XOA, DOI_ROLE, RESET_PASS, KHOA, MO_KHOA
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string HanhDong { get; set; } = string.Empty;

        /// <summary>
        /// EntityType: TAI_KHOAN, VAT_LIEU, VAI_TRO
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string DoiTuong { get; set; } = string.Empty;

        public int? DoiTuongId { get; set; }

        public string? MoTa { get; set; }

        [MaxLength(50)]
        public string? DiaChiIP { get; set; }

        public DateTime ThoiGian { get; set; } = DateTime.Now;

        // Navigation
        [ForeignKey("TaiKhoanId")]
        public virtual TaiKhoan? TaiKhoan { get; set; }
    }
}
