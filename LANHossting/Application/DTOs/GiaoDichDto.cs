using System.ComponentModel.DataAnnotations;

namespace LANHossting.Application.DTOs
{
    /// <summary>
    /// Batch transaction request from Dashboard.
    /// Contains the source warehouse + list of line items.
    /// Each line item specifies its own LoaiPhieu (NHAP/XUAT/DIEUCHUYEN).
    /// </summary>
    public class GiaoDichBatchDto
    {
        [Required(ErrorMessage = "Kho là bắt buộc")]
        [Range(1, int.MaxValue, ErrorMessage = "Kho không hợp lệ")]
        public int KhoId { get; set; }

        public string? GhiChu { get; set; }

        [Required(ErrorMessage = "Danh sách giao dịch không được rỗng")]
        [MinLength(1, ErrorMessage = "Phải có ít nhất 1 giao dịch")]
        public List<GiaoDichItemDto> Items { get; set; } = new();
    }

    /// <summary>
    /// Single transaction line item.
    /// LoaiPhieu: NHAP | XUAT | DIEUCHUYEN
    /// DonGia: if provided and > 0 → updates VatLieu.DonGia (nhập kho only).
    /// </summary>
    public class GiaoDichItemDto
    {
        [Required]
        [Range(1, int.MaxValue)]
        public int VatLieuId { get; set; }

        [Required(ErrorMessage = "Loại phiếu là bắt buộc")]
        public string LoaiPhieu { get; set; } = string.Empty;

        [Required]
        [Range(0.001, double.MaxValue, ErrorMessage = "Số lượng phải > 0")]
        public decimal SoLuong { get; set; }

        /// <summary>
        /// Đơn giá do user nhập. Null/0 = giữ nguyên VatLieu.DonGia hiện tại.
        /// Nếu > 0 (nhập kho) → cập nhật VatLieu.DonGia.
        /// </summary>
        public decimal? DonGia { get; set; }

        /// <summary>
        /// Kho đích — chỉ dùng cho DIEUCHUYEN.
        /// </summary>
        public int? KhoNhanId { get; set; }

        // ── Thông tin bổ sung (nhập kho only, all optional) ──
        public string? SoLo { get; set; }
        public string? NgaySanXuat { get; set; }
        public string? NgayHetHan { get; set; }
        public string? NhaCungCap { get; set; }
        public string? GhiChu { get; set; }
    }
}
