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

    // ============================================
    // Nhóm Vật Liệu
    // ============================================
    [Table("NhomVatLieu")]
    public class NhomVatLieu
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string MaNhom { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string TenNhom { get; set; } = string.Empty;

        public string? MoTa { get; set; }

        // Navigation properties
        public virtual ICollection<VatLieu> VatLieuList { get; set; } = new List<VatLieu>();
    }

    // ============================================
    // Đơn Vị Tính
    // ============================================
    [Table("DonViTinh")]
    public class DonViTinh
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(20)]
        public string MaDonVi { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string TenDonVi { get; set; } = string.Empty;

        // Navigation properties
        public virtual ICollection<VatLieu> VatLieuList { get; set; } = new List<VatLieu>();
    }

    // ============================================
    // Vật Liệu
    // ============================================
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

        public int? NhomVatLieuId { get; set; }

        [Required]
        public int DonViTinhId { get; set; }

        public string? MoTa { get; set; }

        public string? QuyDinhBaoQuan { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal? MucToiThieu { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal? MucToiDa { get; set; }

        [MaxLength(50)]
        public string TrangThai { get; set; } = "Đang sử dụng";

        public DateTime NgayTao { get; set; } = DateTime.Now;

        // Navigation properties
        [ForeignKey("NhomVatLieuId")]
        public virtual NhomVatLieu? NhomVatLieu { get; set; }

        [ForeignKey("DonViTinhId")]
        public virtual DonViTinh? DonViTinh { get; set; }

        public virtual ICollection<TonKho> TonKhoList { get; set; } = new List<TonKho>();
    }

    [Table("TonKho")]
    public class TonKho
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int VatLieuId { get; set; }

        [Required]
        public int KhoId { get; set; }

        [Column(TypeName = "decimal(18, 3)")]
        public decimal SoLuongTon { get; set; } = 0;

        [Column(TypeName = "decimal(18, 3)")]
        public decimal? SoLuongDatCho { get; set; } = 0;

        // SoLuongKhaDung là computed column trong DB, không cần map

        [MaxLength(100)]
        public string? ViTri { get; set; }

        public DateTime NgayCapNhat { get; set; } = DateTime.Now;

        // Navigation properties
        [ForeignKey("VatLieuId")]
        public virtual VatLieu? VatLieu { get; set; }

        [ForeignKey("KhoId")]
        public virtual Kho? Kho { get; set; }
    }

    [Table("PhieuNhapXuat")]
    public class PhieuNhapXuat
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string MaPhieu { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string LoaiPhieu { get; set; } = string.Empty;

        [Required]
        public int PhienLamViecId { get; set; }

        [Required]
        public int TaiKhoanId { get; set; }

        public DateTime NgayPhieu { get; set; } = DateTime.Now;

        public DateTime? NgayThucHien { get; set; }

        public int? KhoNguonId { get; set; }

        public int? KhoNhapId { get; set; }

        public string? LyDo { get; set; }

        [MaxLength(200)]
        public string? NguoiGiaoHang { get; set; }

        [MaxLength(200)]
        public string? DonViCungCap { get; set; }

        [MaxLength(100)]
        public string? SoHoaDon { get; set; }

        [MaxLength(200)]
        public string? NguoiNhanHang { get; set; }

        [MaxLength(200)]
        public string? DonViNhan { get; set; }

        [MaxLength(50)]
        public string TrangThai { get; set; } = "Nháp";

        public int? NguoiDuyet { get; set; }

        public DateTime? NgayDuyet { get; set; }

        public string? LyDoHuy { get; set; }

        public string? GhiChu { get; set; }

        public DateTime NgayTao { get; set; } = DateTime.Now;

        public DateTime NgayCapNhat { get; set; } = DateTime.Now;

        // Navigation properties
        [ForeignKey("PhienLamViecId")]
        public virtual PhienLamViec? PhienLamViec { get; set; }

        [ForeignKey("TaiKhoanId")]
        public virtual TaiKhoan? TaiKhoan { get; set; }

        [ForeignKey("KhoNguonId")]
        public virtual Kho? KhoNguon { get; set; }

        [ForeignKey("KhoNhapId")]
        public virtual Kho? KhoNhap { get; set; }

        [ForeignKey("NguoiDuyet")]
        public virtual TaiKhoan? NguoiDuyetNavigation { get; set; }

        public virtual ICollection<ChiTietPhieuNhapXuat> ChiTietList { get; set; } = new List<ChiTietPhieuNhapXuat>();
    }

    [Table("ChiTietPhieuNhapXuat")]
    public class ChiTietPhieuNhapXuat
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PhieuNhapXuatId { get; set; }

        [Required]
        public int VatLieuId { get; set; }

        [Column(TypeName = "decimal(18, 3)")]
        public decimal SoLuong { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal? DonGia { get; set; }

        [MaxLength(100)]
        public string? ViTri { get; set; }

        [MaxLength(100)]
        public string? SoLo { get; set; }

        public DateTime? NgaySanXuat { get; set; }

        public DateTime? NgayHetHan { get; set; }

        [MaxLength(200)]
        public string? TinhTrangVatLieu { get; set; }

        public string? GhiChu { get; set; }

        // Navigation properties
        [ForeignKey("PhieuNhapXuatId")]
        public virtual PhieuNhapXuat? PhieuNhapXuat { get; set; }

        [ForeignKey("VatLieuId")]
        public virtual VatLieu? VatLieu { get; set; }
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
