namespace LANHossting.Application.DTOs
{
    public class KhoDto
    {
        public int Id { get; set; }
        public string MaKho { get; set; } = string.Empty;
        public string TenKho { get; set; } = string.Empty;
        public string LoaiKho { get; set; } = string.Empty;
        public string? DiaChi { get; set; }
        public int? KhoMeId { get; set; }
    }
}
