using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LANHossting.Domain.Entities.Buoy
{
    /// <summary>
    /// Đơn vị quản lý / vận hành
    /// Table: DmDonVi
    /// </summary>
    [Table("DmDonVi")]
    public class DmDonVi
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string MaDonVi { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string TenDonVi { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? LoaiDonVi { get; set; }

        [MaxLength(500)]
        public string? DiaChi { get; set; }

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
    }
}
