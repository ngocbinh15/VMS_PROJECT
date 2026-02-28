using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LANHossting.Domain.Entities.Buoy
{
    /// <summary>
    /// Lịch sử thay đổi thiết bị phao (xích, rùa, đèn)
    /// Table: LichSuThayDoiThietBi
    /// </summary>
    [Table("LichSuThayDoiThietBi")]
    public class LichSuThayDoiThietBi
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PhaoId { get; set; }

        [Required]
        [MaxLength(100)]
        public string LoaiThietBi { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "date")]
        public DateTime NgayThayDoi { get; set; }

        public string? ThongTinCu { get; set; }

        public string? ThongTinMoi { get; set; }

        public string? LyDoThayDoi { get; set; }

        public string? GhiChu { get; set; }

        public DateTime NgayTao { get; set; } = DateTime.Now;

        [MaxLength(100)]
        public string? NguoiTao { get; set; }

        // Navigation
        [ForeignKey("PhaoId")]
        public virtual Phao? Phao { get; set; }
    }
}
