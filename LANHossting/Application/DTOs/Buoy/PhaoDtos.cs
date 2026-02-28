namespace LANHossting.Application.DTOs.Buoy
{
    /// <summary>
    /// Thống kê tổng quan phao cho Dashboard
    /// </summary>
    public class PhaoThongKeDto
    {
        public int TongSoPhao { get; set; }
        public int SoPhaoTrenLuong { get; set; }
        public int SoPhaoBaoTri { get; set; }
        public int SoPhaoDuPhong { get; set; } // Trên bãi, Thu hồi
        public int SoPhaoSuCo { get; set; }
    }

    /// <summary>
    /// Hiển thị 1 phao trong danh sách bảng
    /// </summary>
    public class PhaoListItemDto
    {
        public int Id { get; set; }
        public string KyHieuTaiSan { get; set; } = string.Empty;
        public string MaPhaoDayDu { get; set; } = string.Empty;
        public string? MaLoaiPhao { get; set; }
        public string? TenPhao { get; set; }
        public int? SoPhaoHienTai { get; set; }
        public decimal? DuongKinhPhao { get; set; }
        public string? TrangThaiHienTai { get; set; }
        public string? ViTriHienTai { get; set; }
        public string? TuyenLuong { get; set; }
        public string? ToaDo { get; set; }
        public DateTime? NgaySuDung { get; set; }
        public DateTime? NgaySuaChuaGanNhat { get; set; }
        public string TrangThaiHienThiClass { get; set; } = string.Empty;
    }

    /// <summary>
    /// Chi tiết đầy đủ 1 phao
    /// </summary>
    public class PhaoChiTietDto
    {
        public int Id { get; set; }
        public string? KyHieuTaiSan { get; set; }
        public string MaPhaoDayDu { get; set; } = string.Empty;
        public string? MaLoaiPhao { get; set; }
        public string? TenPhao { get; set; }
        public int? SoPhaoHienTai { get; set; }

        // Kỹ thuật
        public decimal? DuongKinhPhao { get; set; }
        public decimal? ChieuCaoToanBo { get; set; }
        public string? HinhDang { get; set; }
        public string? VatLieu { get; set; }
        public string? MauSac { get; set; }

        // Thời gian (v1.1)
        public int? ThoiGianSuDung { get; set; }
        public DateTime? ThoiDiemThayTha { get; set; }
        public DateTime? ThoiDiemSuaChuaGanNhat { get; set; }

        // Xích phao
        public decimal? XichPhao_DuongKinh { get; set; }
        public decimal? XichPhao_ChieuDai { get; set; }
        public DateTime? XichPhao_ThoiDiemSuDung { get; set; }

        // Xích rùa
        public decimal? XichRua_DuongKinh { get; set; }
        public decimal? XichRua_ChieuDai { get; set; }
        public DateTime? XichRua_ThoiDiemSuDung { get; set; }

        // Rùa
        public decimal? Rua_TrongLuong { get; set; }
        public DateTime? Rua_ThoiDiemSuDung { get; set; }

        // Hành chính (v1.1)
        public int? TramQuanLyId { get; set; }
        public string? TramQuanLyTen { get; set; }
        public int? TinhThanhPhoId { get; set; }
        public string? TinhThanhPhoTen { get; set; }
        public int? DonViQuanLyId { get; set; }
        public string? DonViQuanLyTen { get; set; }
        public int? DonViVanHanhId { get; set; }
        public string? DonViVanHanhTen { get; set; }

        // Vị trí
        public int? ViTriPhaoBHHienTaiId { get; set; }
        public string? ViTriHienTai { get; set; }
        public int? TuyenLuongId { get; set; }
        public string? TuyenLuong { get; set; }
        public string? ToaDoThietKe { get; set; }

        // Quyết định (v1.1)
        public string? SoQuyetDinhTang { get; set; }
        public DateTime? NgayQuyetDinhTang { get; set; }
        public decimal? DienTich { get; set; }

        // Đèn
        public string? Den_ChungLoai { get; set; }
        public bool? Den_KetNoiAIS { get; set; }
        public string? Den_DacTinhAnhSang { get; set; }
        public decimal? Den_ChieuXaTamSang { get; set; }
        public decimal? Den_ChieuCaoTamSangHaiDo { get; set; }
        public string? Den_NguonCapNangLuong { get; set; }
        public DateTime? Den_ThoiDiemSuDung { get; set; }
        public DateTime? Den_ThoiDiemSuaChua { get; set; }
        public string? Den_SoQuyetDinhTang { get; set; }

        // Trạng thái
        public string? TrangThaiHienTai { get; set; }
    }

    /// <summary>
    /// DTO cho chỉnh sửa phao
    /// </summary>
    public class PhaoEditDto
    {
        public int Id { get; set; }

        [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "Mã phao đầy đủ là bắt buộc")]
        [System.ComponentModel.DataAnnotations.MaxLength(50)]
        public string MaPhaoDayDu { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.MaxLength(50)]
        public string? KyHieuTaiSan { get; set; }

        [System.ComponentModel.DataAnnotations.MaxLength(255)]
        public string? TenPhao { get; set; }

        public int? SoPhaoHienTai { get; set; }
        public decimal? DuongKinhPhao { get; set; }
        public decimal? ChieuCaoToanBo { get; set; }

        [System.ComponentModel.DataAnnotations.MaxLength(100)]
        public string? HinhDang { get; set; }

        [System.ComponentModel.DataAnnotations.MaxLength(100)]
        public string? VatLieu { get; set; }

        [System.ComponentModel.DataAnnotations.MaxLength(100)]
        public string? MauSac { get; set; }

        // Thời gian (v1.1)
        public int? ThoiGianSuDung { get; set; }
        public DateTime? ThoiDiemThayTha { get; set; }
        public DateTime? ThoiDiemSuaChuaGanNhat { get; set; }

        [System.ComponentModel.DataAnnotations.MaxLength(255)]
        public string? TrangThaiHienTai { get; set; }

        public int? ViTriPhaoBHHienTaiId { get; set; }

        // Xích phao
        public decimal? XichPhao_DuongKinh { get; set; }
        public decimal? XichPhao_ChieuDai { get; set; }
        public DateTime? XichPhao_ThoiDiemSuDung { get; set; }

        // Xích rùa
        public decimal? XichRua_DuongKinh { get; set; }
        public decimal? XichRua_ChieuDai { get; set; }
        public DateTime? XichRua_ThoiDiemSuDung { get; set; }

        // Rùa
        public decimal? Rua_TrongLuong { get; set; }
        public DateTime? Rua_ThoiDiemSuDung { get; set; }

        // Hành chính (v1.1)
        public int? TramQuanLyId { get; set; }
        public int? TinhThanhPhoId { get; set; }
        public int? DonViQuanLyId { get; set; }
        public int? DonViVanHanhId { get; set; }

        // Quyết định (v1.1)
        [System.ComponentModel.DataAnnotations.MaxLength(100)]
        public string? SoQuyetDinhTang { get; set; }
        public DateTime? NgayQuyetDinhTang { get; set; }
        public decimal? DienTich { get; set; }

        // Đèn
        public string? Den_ChungLoai { get; set; }
        public bool? Den_KetNoiAIS { get; set; }
        public string? Den_DacTinhAnhSang { get; set; }
        public decimal? Den_ChieuXaTamSang { get; set; }
        public decimal? Den_ChieuCaoTamSangHaiDo { get; set; }
        public string? Den_NguonCapNangLuong { get; set; }
        public DateTime? Den_ThoiDiemSuDung { get; set; }
        public DateTime? Den_ThoiDiemSuaChua { get; set; }
        public string? Den_SoQuyetDinhTang { get; set; }
    }

    /// <summary>
    /// Tuyến luồng cho dropdown/filter
    /// </summary>
    public class TuyenLuongDto
    {
        public int Id { get; set; }
        public string MaTuyen { get; set; } = string.Empty;
        public string TenTuyen { get; set; } = string.Empty;
        public int SoViTri { get; set; }
        public int SoPhaoTrenLuong { get; set; }
    }
}
