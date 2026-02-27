using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LANHossting.Domain.Entities.Buoy
{
    /// <summary>
    /// Phao báo hiệu hàng hải - Master data
    /// Table: Phao
    /// Giữ nguyên 100% schema DB
    /// </summary>
    [Table("Phao")]
    public class Phao
    {
        [Key]
        public int Id { get; set; }

        // ── Định danh ──
        [MaxLength(50)]
        public string? KyHieuTaiSan { get; set; }

        [Required]
        [MaxLength(50)]
        public string MaPhaoDayDu { get; set; } = string.Empty;

        /// <summary>
        /// Computed column PERSISTED: LEFT(MaPhaoDayDu, CHARINDEX('.', MaPhaoDayDu) - 1)
        /// </summary>
        [MaxLength(50)]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string? MaLoaiPhao { get; set; }

        [MaxLength(255)]
        public string? TenPhao { get; set; }

        public int? SoPhaoHienTai { get; set; }

        // ── Kỹ thuật cơ bản ──
        [Column(TypeName = "decimal(10, 2)")]
        public decimal? DuongKinhPhao { get; set; }

        [Column(TypeName = "decimal(10, 2)")]
        public decimal? ChieuCaoToanBo { get; set; }

        [MaxLength(100)]
        public string? HinhDang { get; set; }

        [MaxLength(100)]
        public string? VatLieu { get; set; }

        [MaxLength(100)]
        public string? MauSac { get; set; }

        // ── Xích phao ──
        [Column(TypeName = "decimal(10, 2)")]
        public decimal? XichPhao_DuongKinh { get; set; }

        [Column(TypeName = "decimal(10, 2)")]
        public decimal? XichPhao_ChieuDai { get; set; }

        [Column(TypeName = "date")]
        public DateTime? XichPhao_ThoiDiemSuDung { get; set; }

        // ── Xích rùa ──
        [Column(TypeName = "decimal(10, 2)")]
        public decimal? XichRua_DuongKinh { get; set; }

        [Column(TypeName = "decimal(10, 2)")]
        public decimal? XichRua_ChieuDai { get; set; }

        [Column(TypeName = "date")]
        public DateTime? XichRua_ThoiDiemSuDung { get; set; }

        // ── Rùa ──
        [Column(TypeName = "decimal(10, 2)")]
        public decimal? Rua_TrongLuong { get; set; }

        [Column(TypeName = "date")]
        public DateTime? Rua_ThoiDiemSuDung { get; set; }

        // ── Đèn báo hiệu ──
        [MaxLength(100)]
        public string? Den_ChungLoai { get; set; }

        public bool? Den_KetNoiAIS { get; set; }

        [MaxLength(255)]
        public string? Den_DacTinhAnhSang { get; set; }

        [Column(TypeName = "decimal(10, 2)")]
        public decimal? Den_ChieuXaTamSang { get; set; }

        [MaxLength(100)]
        public string? Den_NguonCapNangLuong { get; set; }

        [Column(TypeName = "date")]
        public DateTime? Den_ThoiDiemSuDung { get; set; }

        [Column(TypeName = "date")]
        public DateTime? Den_ThoiDiemSuaChua { get; set; }

        // ── Trạng thái hiện tại (cache) ──
        [MaxLength(255)]
        public string? TrangThaiHienTai { get; set; }

        public int? ViTriPhaoBHHienTaiId { get; set; }

        // ── Audit ──
        public DateTime NgayTao { get; set; } = DateTime.Now;

        [MaxLength(100)]
        public string? NguoiTao { get; set; }

        public DateTime? NgayCapNhat { get; set; }

        [MaxLength(100)]
        public string? NguoiCapNhat { get; set; }

        // ── Navigation ──
        [ForeignKey("ViTriPhaoBHHienTaiId")]
        public virtual DmViTriPhaoBH? ViTriPhaoBHHienTai { get; set; }

        public virtual ICollection<LichSuHoatDongPhao> LichSuHoatDongList { get; set; } = new List<LichSuHoatDongPhao>();
        public virtual ICollection<LichSuBaoTri> LichSuBaoTriList { get; set; } = new List<LichSuBaoTri>();
        public virtual ICollection<LichSuThayDoiThietBi> LichSuThayDoiThietBiList { get; set; } = new List<LichSuThayDoiThietBi>();
    }
}
