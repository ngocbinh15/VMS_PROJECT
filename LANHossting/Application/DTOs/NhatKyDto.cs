namespace LANHossting.Application.DTOs
{
    /// <summary>
    /// Query filter for Nhật Ký (history log) listing.
    /// All filters optional — unset = no filter.
    /// </summary>
    public class NhatKyFilterDto
    {
        public DateTime? TuNgay { get; set; }
        public DateTime? DenNgay { get; set; }
        public int? KhoId { get; set; }
        public string? LoaiThayDoi { get; set; }
        public int? VatLieuId { get; set; }
        public string? SearchVatLieu { get; set; }
        public int? TaiKhoanId { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    /// <summary>
    /// One row in the Nhật Ký phiếu list (grouped by PhieuNhapXuat).
    /// </summary>
    public class NhatKyPhieuDto
    {
        public int PhieuId { get; set; }
        public string MaPhieu { get; set; } = string.Empty;
        public string LoaiPhieu { get; set; } = string.Empty;
        public string TenKhoNguon { get; set; } = string.Empty;
        public string? TenKhoNhap { get; set; }
        public string NguoiThucHien { get; set; } = string.Empty;
        public DateTime NgayThucHien { get; set; }
        public string TrangThai { get; set; } = string.Empty;
        public int TongSoVatTu { get; set; }
        public string? GhiChu { get; set; }
    }

    /// <summary>
    /// Paginated list wrapper — includes total count for paging.
    /// </summary>
    public class PagedResult<T>
    {
        public List<T> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    }

    /// <summary>
    /// One row in the chi tiết nhật ký (LichSuVatLieu detail per phiếu).
    /// </summary>
    public class NhatKyChiTietDto
    {
        public int Id { get; set; }
        public string MaVatLieu { get; set; } = string.Empty;
        public string TenVatLieu { get; set; } = string.Empty;
        public string DonViTinh { get; set; } = string.Empty;
        public string TenKho { get; set; } = string.Empty;
        public string? TenKhoLienQuan { get; set; }
        public string LoaiThayDoi { get; set; } = string.Empty;
        public decimal SoLuongTruoc { get; set; }
        public decimal SoLuongThayDoi { get; set; }
        public decimal SoLuongSau { get; set; }
        public DateTime ThoiGian { get; set; }
        public string NguoiThucHien { get; set; } = string.Empty;
        public string? GhiChu { get; set; }
    }

    /// <summary>
    /// Header info for phiếu detail view.
    /// </summary>
    public class NhatKyPhieuHeaderDto
    {
        public int PhieuId { get; set; }
        public string MaPhieu { get; set; } = string.Empty;
        public string LoaiPhieu { get; set; } = string.Empty;
        public string TenKhoNguon { get; set; } = string.Empty;
        public string? TenKhoNhap { get; set; }
        public string NguoiThucHien { get; set; } = string.Empty;
        public DateTime NgayThucHien { get; set; }
        public string TrangThai { get; set; } = string.Empty;
        public string? LyDo { get; set; }
        public string? GhiChu { get; set; }
        public List<NhatKyChiTietDto> ChiTiet { get; set; } = new();
    }
}
