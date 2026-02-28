using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LANHossting.Domain.Entities.Buoy
{
    /// <summary>
    /// Tỉnh / Thành phố
    /// Table: DmTinhThanhPho
    /// </summary>
    [Table("DmTinhThanhPho")]
    public class DmTinhThanhPho
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(10)]
        public string MaTinh { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string TenTinh { get; set; } = string.Empty;

        public int? ThuTuHienThi { get; set; }

        [MaxLength(50)]
        public string TrangThai { get; set; } = "Hoạt động";

        public DateTime NgayTao { get; set; } = DateTime.Now;

        [MaxLength(100)]
        public string? NguoiTao { get; set; }
    }
}
