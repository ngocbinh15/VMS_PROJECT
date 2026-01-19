using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LANHossting.Models
{
    // ============================================
    // BUOY MODULE - Danh mục
    // ============================================

    [Table("DmTuyenLuong")]
    public class DmTuyenLuong
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string MaTuyen { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string TenTuyen { get; set; } = string.Empty;

        public string? MoTa { get; set; }

        public int? ThuTuHienThi { get; set; }

        [MaxLength(50)]
        public string TrangThai { get; set; } = "Hoạt động";

        public DateTime NgayTao { get; set; } = DateTime.Now;

        [MaxLength(100)]
        public string? NguoiTao { get; set; }

        public DateTime? NgayCapNhat { get; set; }

        [MaxLength(100)]
        public string? NguoiCapNhat { get; set; }

        // Navigation properties
        public virtual ICollection<DmViTriPhaoBH> ViTriPhaoList { get; set; } = new List<DmViTriPhaoBH>();
    }

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

        // Navigation properties
        [ForeignKey("TuyenLuongId")]
        public virtual DmTuyenLuong? TuyenLuong { get; set; }
    }

    [Table("Phao")]
    public class Phao
    {
        [Key]
        public int Id { get; set; }

        [MaxLength(50)]
        public string? KyHieuTaiSan { get; set; }

        [Required]
        [MaxLength(50)]
        public string MaPhaoDayDu { get; set; } = string.Empty;

        [MaxLength(50)]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public string? MaLoaiPhao { get; set; }

        [MaxLength(255)]
        public string? TenPhao { get; set; }

        public int? SoPhaoHienTai { get; set; }

        // Kỹ thuật cơ bản
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

        // Xích và Rùa
        [Column(TypeName = "decimal(10, 2)")]
        public decimal? XichPhao_DuongKinh { get; set; }

        [Column(TypeName = "decimal(10, 2)")]
        public decimal? XichPhao_ChieuDai { get; set; }

        [Column(TypeName = "date")]
        public DateTime? XichPhao_ThoiDiemSuDung { get; set; }

        [Column(TypeName = "decimal(10, 2)")]
        public decimal? XichRua_DuongKinh { get; set; }

        [Column(TypeName = "decimal(10, 2)")]
        public decimal? XichRua_ChieuDai { get; set; }

        [Column(TypeName = "date")]
        public DateTime? XichRua_ThoiDiemSuDung { get; set; }

        [Column(TypeName = "decimal(10, 2)")]
        public decimal? Rua_TrongLuong { get; set; }

        [Column(TypeName = "date")]
        public DateTime? Rua_ThoiDiemSuDung { get; set; }

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
