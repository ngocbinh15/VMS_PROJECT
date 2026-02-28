using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LANHossting.Domain.Entities.Buoy
{
    /// <summary>
    /// Vị trí Phao Báo Hiệu cố định trên luồng
    /// Table: DmViTriPhaoBH
    /// </summary>
    [Table("DmViTriPhaoBH")]
    public class DmViTriPhaoBH
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TuyenLuongId { get; set; }

        [Required]
        [MaxLength(50)]
        public string SoViTri { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string MaPhaoBH { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? ToaDoThietKe { get; set; }

        public string? MoTa { get; set; }

        public int? ThuTuHienThi { get; set; }

        [MaxLength(50)]
        public string TrangThai { get; set; } = "Hoạt động";

        public DateTime NgayTao { get; set; } = DateTime.Now;

        [MaxLength(100)]
        public string? NguoiTao { get; set; }

        // Navigation
        [ForeignKey("TuyenLuongId")]
        public virtual DmTuyenLuong? TuyenLuong { get; set; }

        public virtual ICollection<Phao> PhaoHienTaiList { get; set; } = new List<Phao>();
        public virtual ICollection<LichSuHoatDongPhao> LichSuHoatDongList { get; set; } = new List<LichSuHoatDongPhao>();
    }
}
