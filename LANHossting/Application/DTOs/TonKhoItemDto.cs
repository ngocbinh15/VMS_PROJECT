namespace LANHossting.Application.DTOs
{
    /// <summary>
    /// DTO for inventory item display.
    /// DonGia sourced exclusively from VatLieu.DonGia.
    /// GiaTri = SoLuongTon * VatLieu.DonGia.
    /// SoLuongKhaDung = TonKho.SoLuongKhaDung (computed: SoLuongTon - SoLuongDatCho).
    /// </summary>
    public class TonKhoItemDto
    {
        public int Id { get; set; }
        public int VatLieuId { get; set; }
        public string MaVatLieu { get; set; } = string.Empty;
        public string TenVatLieu { get; set; } = string.Empty;
        public int NhomVatLieuId { get; set; }
        public string NhomVatLieu { get; set; } = string.Empty;
        public int DonViTinhId { get; set; }
        public string DonViTinh { get; set; } = string.Empty;
        public decimal SoLuongTon { get; set; }
        public decimal SoLuongKhaDung { get; set; }
        public decimal DonGia { get; set; }
        public decimal GiaTri { get; set; }
    }
}
