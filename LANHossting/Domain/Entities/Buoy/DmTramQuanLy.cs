using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LANHossting.Domain.Entities.Buoy
{
    /// <summary>
    /// Trạm quản lý báo hiệu luồng hàng hải
    /// Table: DmTramQuanLy
    /// </summary>
    [Table("DmTramQuanLy")]
    public class DmTramQuanLy
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string MaTram { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string TenTram { get; set; } = string.Empty;

        public int? DonViChuQuanId { get; set; }

        [MaxLength(255)]
        public string? DiaDiem { get; set; }

        [MaxLength(50)]
        public string? SoDienThoai { get; set; }

        public int? ThuTuHienThi { get; set; }

        [MaxLength(50)]
        public string TrangThai { get; set; } = "Hoạt động";

        public DateTime NgayTao { get; set; } = DateTime.Now;

        [MaxLength(100)]
        public string? NguoiTao { get; set; }

        public DateTime? NgayCapNhat { get; set; }

        [MaxLength(100)]
        public string? NguoiCapNhat { get; set; }

        // Navigation
        [ForeignKey("DonViChuQuanId")]
        public virtual DmDonVi? DonViChuQuan { get; set; }
    }
}
