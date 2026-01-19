using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LANHossting.Models
{
    // ============================================
    // WAREHOUSE MODULE - Authentication & User
    // ============================================

    [Table("VaiTro")]
    public class VaiTro
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(20)]
        public string MaVaiTro { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string TenVaiTro { get; set; } = string.Empty;

        public string? MoTa { get; set; }

        public DateTime NgayTao { get; set; } = DateTime.Now;

        // Navigation properties
        public virtual ICollection<TaiKhoan> TaiKhoanList { get; set; } = new List<TaiKhoan>();
    }

    [Table("TaiKhoan")]
    public class TaiKhoan
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string TenDangNhap { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string MatKhau { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string HoTen { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Email { get; set; }

        [MaxLength(20)]
        public string? SoDienThoai { get; set; }

        [Required]
        public int VaiTroId { get; set; }

        [MaxLength(50)]
        public string TrangThai { get; set; } = "Hoạt động";

        public DateTime NgayTao { get; set; } = DateTime.Now;

        public DateTime NgayCapNhat { get; set; } = DateTime.Now;

        public int? NguoiTao { get; set; }

        // Navigation properties
        [ForeignKey("VaiTroId")]
        public virtual VaiTro? VaiTro { get; set; }
    }

    [Table("PhienLamViec")]
    public class PhienLamViec
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TaiKhoanId { get; set; }

        public DateTime ThoiGianDangNhap { get; set; } = DateTime.Now;

        public DateTime? ThoiGianDangXuat { get; set; }

        [MaxLength(50)]
        public string? DiaChi_IP { get; set; }

        [MaxLength(200)]
        public string? ThietBi { get; set; }

        [MaxLength(50)]
        public string TrangThai { get; set; } = "Đang hoạt động";

        public string? GhiChu { get; set; }

        // Navigation properties
        [ForeignKey("TaiKhoanId")]
        public virtual TaiKhoan? TaiKhoan { get; set; }
    }

    // ============================================
    // WAREHOUSE MODULE - Kho
    // ============================================

    [Table("Kho")]
    public class Kho
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string MaKho { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string TenKho { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string LoaiKho { get; set; } = string.Empty; // KHO_ME, KHO_CON

        public int? KhoMeId { get; set; }

        [MaxLength(200)]
        public string? DiaChi { get; set; }

        [MaxLength(100)]
        public string? NguoiQuanLy { get; set; }

        [MaxLength(20)]
        public string? SoDienThoai { get; set; }

        [MaxLength(50)]
        public string TrangThai { get; set; } = "Hoạt động";

        public DateTime NgayTao { get; set; } = DateTime.Now;

        public DateTime? NgayCapNhat { get; set; }

        // Navigation properties
        [ForeignKey("KhoMeId")]
        public virtual Kho? KhoMe { get; set; }
        
        public virtual ICollection<Kho> KhoConList { get; set; } = new List<Kho>();
        public virtual ICollection<TonKho> TonKhoList { get; set; } = new List<TonKho>();
    }

    [Table("VatLieu")]
    public class VatLieu
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string MaVatLieu { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string TenVatLieu { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string NhomVatLieu { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? DonViTinh { get; set; }

        public string? ThongSoKyThuat { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal? DonGia { get; set; }

        [MaxLength(50)]
        public string TrangThai { get; set; } = "Hoạt động";

        public DateTime NgayTao { get; set; } = DateTime.Now;

        // Navigation properties
        public virtual ICollection<TonKho> TonKhoList { get; set; } = new List<TonKho>();
        public virtual ICollection<PhieuNhapXuat> PhieuNhapXuatList { get; set; } = new List<PhieuNhapXuat>();
    }

    [Table("TonKho")]
    public class TonKho
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int KhoId { get; set; }

        [Required]
        public int VatLieuId { get; set; }

        [Column(TypeName = "decimal(18, 3)")]
        public decimal SoLuongTon { get; set; } = 0;

        [Column(TypeName = "decimal(18, 2)")]
        public decimal? GiaTriTon { get; set; }

        public DateTime NgayCapNhat { get; set; } = DateTime.Now;

        // Navigation properties
        [ForeignKey("KhoId")]
        public virtual Kho? Kho { get; set; }

        [ForeignKey("VatLieuId")]
        public virtual VatLieu? VatLieu { get; set; }
    }

    [Table("PhieuNhapXuat")]
    public class PhieuNhapXuat
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string SoPhieu { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string LoaiPhieu { get; set; } = string.Empty; // NHAP, XUAT, CHUYEN

        public DateTime NgayPhieu { get; set; } = DateTime.Now;

        public int? KhoNguonId { get; set; }

        public int? KhoNhanId { get; set; }

        [Required]
        public int VatLieuId { get; set; }

        [Column(TypeName = "decimal(18, 3)")]
        public decimal SoLuong { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal? DonGia { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal? ThanhTien { get; set; }

        public string? LyDo { get; set; }

        [MaxLength(100)]
        public string? NguonGoc { get; set; }

        public int? NguoiLapId { get; set; }

        public int? NguoiDuyetId { get; set; }

        public DateTime? NgayDuyet { get; set; }

        [MaxLength(50)]
        public string TrangThai { get; set; } = "Chờ duyệt";

        public string? GhiChu { get; set; }

        // Navigation properties
        [ForeignKey("KhoNguonId")]
        public virtual Kho? KhoNguon { get; set; }

        [ForeignKey("KhoNhanId")]
        public virtual Kho? KhoNhan { get; set; }

        [ForeignKey("VatLieuId")]
        public virtual VatLieu? VatLieu { get; set; }

        [ForeignKey("NguoiLapId")]
        public virtual TaiKhoan? NguoiLap { get; set; }

        [ForeignKey("NguoiDuyetId")]
        public virtual TaiKhoan? NguoiDuyet { get; set; }
    }

    [Table("LichSuVatLieu")]
    public class LichSuVatLieu
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int VatLieuId { get; set; }

        [Required]
        public int PhieuNhapXuatId { get; set; }

        public DateTime ThoiGian { get; set; } = DateTime.Now;

        [Required]
        [MaxLength(20)]
        public string HanhDong { get; set; } = string.Empty; // NHAP, XUAT, CHUYEN

        [Column(TypeName = "decimal(18, 3)")]
        public decimal SoLuong { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal? DonGia { get; set; }

        public int? KhoId { get; set; }

        public int? NguoiThucHienId { get; set; }

        public string? GhiChu { get; set; }

        // Navigation properties
        [ForeignKey("VatLieuId")]
        public virtual VatLieu? VatLieu { get; set; }

        [ForeignKey("PhieuNhapXuatId")]
        public virtual PhieuNhapXuat? PhieuNhapXuat { get; set; }

        [ForeignKey("KhoId")]
        public virtual Kho? Kho { get; set; }

        [ForeignKey("NguoiThucHienId")]
        public virtual TaiKhoan? NguoiThucHien { get; set; }
    }
}
