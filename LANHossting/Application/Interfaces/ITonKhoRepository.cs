using LANHossting.Application.DTOs;

namespace LANHossting.Application.Interfaces
{
    /// <summary>
    /// Repository interface for inventory queries.
    /// All pricing sourced from VatLieu.DonGia — no transaction history.
    /// </summary>
    public interface ITonKhoRepository
    {
        /// <summary>
        /// Single projection query: TonKho JOIN VatLieu JOIN DonViTinh JOIN NhomVatLieu JOIN Kho.
        /// DonGia = VatLieu.DonGia. GiaTri = SoLuongTon * VatLieu.DonGia.
        /// </summary>
        Task<List<TonKhoItemDto>> GetTonKhoByKhoIdAsync(int khoId, string? search = null);

        /// <summary>
        /// Dashboard statistics computed from TonKho + VatLieu only.
        /// TongGiaTriTonKho = SUM(TonKho.SoLuongTon * VatLieu.DonGia).
        /// </summary>
        Task<DashboardThongKeDto> GetDashboardThongKeAsync(int? khoId = null);

        /// <summary>
        /// Active warehouse list for filter dropdown.
        /// </summary>
        Task<List<KhoDto>> GetDanhSachKhoAsync();
    }
}
