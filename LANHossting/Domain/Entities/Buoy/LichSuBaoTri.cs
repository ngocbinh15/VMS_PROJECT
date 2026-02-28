using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LANHossting.Domain.Entities.Buoy
{
    /// <summary>
    /// Lịch sử bảo trì phao
    /// Table: LichSuBaoTri
    /// </summary>
    [Table("LichSuBaoTri")]
    public class LichSuBaoTri
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PhaoId { get; set; }

        [Required]
        [MaxLength(100)]
        public string LoaiBaoTri { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "date")]
        public DateTime NgayBaoTri { get; set; }

        public string? NoiDungCongViec { get; set; }

        public string? KetQuaBaoTri { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal? ChiPhi { get; set; }

        [MaxLength(255)]
        public string? DonViThucHien { get; set; }

        [MaxLength(100)]
        public string? NguoiPhuTrach { get; set; }

        public string? GhiChu { get; set; }

        public DateTime NgayTao { get; set; } = DateTime.Now;

        [MaxLength(100)]
        public string? NguoiTao { get; set; }

        // Navigation
        [ForeignKey("PhaoId")]
        public virtual Phao? Phao { get; set; }
    }
}
