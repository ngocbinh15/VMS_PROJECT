namespace LANHossting.Application.DTOs
{
    /// <summary>
    /// DTO for dashboard statistics.
    /// TongGiaTriTonKho = SUM(TonKho.SoLuongTon * VatLieu.DonGia).
    /// </summary>
    public class DashboardThongKeDto
    {
        public int TongSoVatLieu { get; set; }
        public decimal TongSoLuongTon { get; set; }
        public decimal TongGiaTriTonKho { get; set; }
    }
}
