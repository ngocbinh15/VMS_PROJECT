using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LANHossting.Domain.Entities.Buoy
{
    /// <summary>
    /// Lịch sử hoạt động phao - Snapshot pattern
    /// Table: LichSuHoatDongPhao
    /// </summary>
    [Table("LichSuHoatDongPhao")]
    public class LichSuHoatDongPhao
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PhaoId { get; set; }

        // ── Thời gian ──
        [Required]
        public int Nam { get; set; }

        [Required]
        [Column(TypeName = "date")]
        public DateTime NgayBatDau { get; set; }

        [Column(TypeName = "date")]
        public DateTime? NgayKetThuc { get; set; }

        // ── Trạng thái ──
        [Required]
        [MaxLength(50)]
        public string LoaiTrangThai { get; set; } = string.Empty;

        public string? MoTaTrangThai { get; set; }

        // ── Snapshot vị trí ──
        public int? ViTriPhaoBHId { get; set; }

        [MaxLength(50)]
        public string? MaPhaoBH { get; set; }

        [MaxLength(50)]
        public string? MaTuyenLuong { get; set; }

        // ── Tọa độ thực tế ──
        [Column(TypeName = "decimal(10, 6)")]
        public decimal? KinhDo { get; set; }

        [Column(TypeName = "decimal(10, 6)")]
        public decimal? ViDo { get; set; }

        [MaxLength(255)]
        public string? DiaDiem { get; set; }

        // ── Metadata ──
        public string? GhiChu { get; set; }

        public DateTime NgayTao { get; set; } = DateTime.Now;

        [MaxLength(100)]
        public string? NguoiTao { get; set; }

        // ── Navigation ──
        [ForeignKey("PhaoId")]
        public virtual Phao? Phao { get; set; }

        [ForeignKey("ViTriPhaoBHId")]
        public virtual DmViTriPhaoBH? ViTriPhaoBH { get; set; }
    }
}
