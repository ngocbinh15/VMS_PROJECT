namespace LANHossting.Application.DTOs
{
    // ═══════════════════════════════════════════
    // ADMIN MODULE — DTOs
    // ═══════════════════════════════════════════

    // ── TÀI KHOẢN ──────────────────────────────

    /// <summary>
    /// Hiển thị danh sách tài khoản cho Admin.
    /// </summary>
    public class TaiKhoanListDto
    {
        public int Id { get; set; }
        public string TenDangNhap { get; set; } = string.Empty;
        public string HoTen { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? SoDienThoai { get; set; }
        public string MaVaiTro { get; set; } = string.Empty;
        public string TenVaiTro { get; set; } = string.Empty;
        public string TrangThai { get; set; } = string.Empty;
        public DateTime NgayTao { get; set; }
    }

    /// <summary>
    /// DTO tạo tài khoản mới.
    /// </summary>
    public class CreateTaiKhoanDto
    {
        public string TenDangNhap { get; set; } = string.Empty;
        public string MatKhau { get; set; } = string.Empty;
        public string HoTen { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? SoDienThoai { get; set; }
        public int VaiTroId { get; set; }
    }

    /// <summary>
    /// DTO cập nhật tài khoản.
    /// </summary>
    public class UpdateTaiKhoanDto
    {
        public int Id { get; set; }
        public string HoTen { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? SoDienThoai { get; set; }
        public int VaiTroId { get; set; }
    }

    /// <summary>
    /// DTO đổi mật khẩu / reset mật khẩu.
    /// </summary>
    public class ResetPasswordDto
    {
        public int TaiKhoanId { get; set; }
        public string MatKhauMoi { get; set; } = string.Empty;
    }

    // ── VẬT LIỆU (Admin) ───────────────────────

    /// <summary>
    /// Hiển thị danh sách vật liệu cho Admin.
    /// </summary>
    public class VatLieuListDto
    {
        public int Id { get; set; }
        public string MaVatLieu { get; set; } = string.Empty;
        public string TenVatLieu { get; set; } = string.Empty;
        public string? TenNhomVatLieu { get; set; }
        public int? NhomVatLieuId { get; set; }
        public string TenDonViTinh { get; set; } = string.Empty;
        public int DonViTinhId { get; set; }
        public decimal DonGia { get; set; }
        public decimal? MucToiThieu { get; set; }
        public decimal? MucToiDa { get; set; }
        public string TrangThai { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO cập nhật vật liệu (chỉ fields admin được sửa).
    /// </summary>
    public class UpdateVatLieuDto
    {
        public int Id { get; set; }
        public string TenVatLieu { get; set; } = string.Empty;
        public int? NhomVatLieuId { get; set; }
        public int DonViTinhId { get; set; }
        public decimal DonGia { get; set; }
        public decimal? MucToiThieu { get; set; }
        public decimal? MucToiDa { get; set; }
        public string? MoTa { get; set; }
    }

    // ── NHẬT KÝ HỆ THỐNG ───────────────────────

    /// <summary>
    /// Filter nhật ký hệ thống.
    /// </summary>
    public class SystemLogFilterDto
    {
        public DateTime? TuNgay { get; set; }
        public DateTime? DenNgay { get; set; }
        public int? TaiKhoanId { get; set; }
        public string? HanhDong { get; set; }
        public string? DoiTuong { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    /// <summary>
    /// Hiển thị 1 dòng nhật ký hệ thống.
    /// </summary>
    public class SystemLogItemDto
    {
        public int Id { get; set; }
        public DateTime ThoiGian { get; set; }
        public string NguoiThucHien { get; set; } = string.Empty;
        public string HanhDong { get; set; } = string.Empty;
        public string DoiTuong { get; set; } = string.Empty;
        public int? DoiTuongId { get; set; }
        public string? MoTa { get; set; }
        public string? DiaChiIP { get; set; }
    }

    /// <summary>
    /// DTO cho dropdown vai trò.
    /// </summary>
    public class VaiTroDropdownDto
    {
        public int Id { get; set; }
        public string MaVaiTro { get; set; } = string.Empty;
        public string TenVaiTro { get; set; } = string.Empty;
    }
}
