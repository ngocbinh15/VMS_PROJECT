namespace LANHossting.Domain.Enums
{
    /// <summary>
    /// Các trạng thái hoạt động hợp lệ của phao.
    /// Dùng để populate dropdown và so sánh logic nghiệp vụ.
    /// </summary>
    public static class TrangThaiHoatDongPhao
    {
        public const string TrenLuong  = "Trên luồng";
        public const string ThuHoi     = "Thu hồi";
        public const string ChoThue    = "Cho thuê";
        public const string SuaChua    = "Sửa chữa";
        public const string MatDau     = "Mất dấu";

        /// <summary>
        /// TinhTrang suy ra: "Có sử dụng" hoặc "Không sử dụng"
        /// </summary>
        public static string InferTinhTrang(string? trangThaiHoatDong)
        {
            return trangThaiHoatDong == TrenLuong ? "Có sử dụng" : "Không sử dụng";
        }

        /// <summary>
        /// Kiểm tra trạng thái có yêu cầu Tuyến luồng + Vị trí không
        /// </summary>
        public static bool RequireViTri(string? trangThaiHoatDong)
        {
            return trangThaiHoatDong == TrenLuong;
        }

        public static readonly string[] TatCa = { TrenLuong, ThuHoi, ChoThue, SuaChua, MatDau };
    }
}
