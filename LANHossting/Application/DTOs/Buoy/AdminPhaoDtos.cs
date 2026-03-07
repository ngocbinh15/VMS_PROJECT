namespace LANHossting.Application.DTOs.Buoy
{
    // ── Overview stats ──
    public class AdminPhaoThongKeDto
    {
        public int TongPhao { get; set; }
        public int TongTuyenLuong { get; set; }
        public int TongViTri { get; set; }
        public int TongTram { get; set; }
        public int TongDonVi { get; set; }
    }

    // ── DmTinhThanhPho ──
    public class TinhThanhPhoDto
    {
        public int Id { get; set; }
        public string MaTinh { get; set; } = "";
        public string TenTinh { get; set; } = "";
        public int? ThuTuHienThi { get; set; }
        public string TrangThai { get; set; } = "";
    }

    public class SaveTinhThanhPhoDto
    {
        public string MaTinh { get; set; } = "";
        public string TenTinh { get; set; } = "";
        public int? ThuTuHienThi { get; set; }
    }

    // ── DmDonVi ──
    public class DonViDto
    {
        public int Id { get; set; }
        public string MaDonVi { get; set; } = "";
        public string TenDonVi { get; set; } = "";
        public string? LoaiDonVi { get; set; }
        public string? DiaChi { get; set; }
        public string? SoDienThoai { get; set; }
        public int? ThuTuHienThi { get; set; }
        public string TrangThai { get; set; } = "";
    }

    public class SaveDonViDto
    {
        public string MaDonVi { get; set; } = "";
        public string TenDonVi { get; set; } = "";
        public string? LoaiDonVi { get; set; }
        public string? DiaChi { get; set; }
        public string? SoDienThoai { get; set; }
        public int? ThuTuHienThi { get; set; }
    }

    // ── DmTramQuanLy ──
    public class TramQuanLyDto
    {
        public int Id { get; set; }
        public string MaTram { get; set; } = "";
        public string TenTram { get; set; } = "";
        public int? DonViChuQuanId { get; set; }
        public string? TenDonViChuQuan { get; set; }
        public string? DiaDiem { get; set; }
        public string? SoDienThoai { get; set; }
        public int? ThuTuHienThi { get; set; }
        public string TrangThai { get; set; } = "";
    }

    public class SaveTramQuanLyDto
    {
        public string MaTram { get; set; } = "";
        public string TenTram { get; set; } = "";
        public int? DonViChuQuanId { get; set; }
        public string? DiaDiem { get; set; }
        public string? SoDienThoai { get; set; }
        public int? ThuTuHienThi { get; set; }
    }

    // ── DmTuyenLuong ──
    public class TuyenLuongAdminDto
    {
        public int Id { get; set; }
        public string MaTuyen { get; set; } = "";
        public string TenTuyen { get; set; } = "";
        public string? MoTa { get; set; }
        public int? ThuTuHienThi { get; set; }
        public string TrangThai { get; set; } = "";
        public int SoViTri { get; set; }
    }

    public class SaveTuyenLuongDto
    {
        public string MaTuyen { get; set; } = "";
        public string TenTuyen { get; set; } = "";
        public string? MoTa { get; set; }
        public int? ThuTuHienThi { get; set; }
    }

    // ── DmViTriPhaoBH ──
    public class ViTriPhaoBHDto
    {
        public int Id { get; set; }
        public int TuyenLuongId { get; set; }
        public string? TenTuyen { get; set; }
        public string SoViTri { get; set; } = "";
        public string MaPhaoBH { get; set; } = "";
        public string? ToaDoThietKe { get; set; }
        public string? MoTa { get; set; }
        public int? ThuTuHienThi { get; set; }
        public string TrangThai { get; set; } = "";
    }

    public class SaveViTriPhaoBHDto
    {
        public int TuyenLuongId { get; set; }
        public string SoViTri { get; set; } = "";
        public string MaPhaoBH { get; set; } = "";
        public string? ToaDoThietKe { get; set; }
        public string? MoTa { get; set; }
        public int? ThuTuHienThi { get; set; }
    }
}
