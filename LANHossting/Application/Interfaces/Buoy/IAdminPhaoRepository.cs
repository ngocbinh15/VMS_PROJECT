using LANHossting.Application.DTOs.Buoy;

namespace LANHossting.Application.Interfaces.Buoy
{
    public interface IAdminPhaoRepository
    {
        // ── Stats ──
        Task<AdminPhaoThongKeDto> GetThongKeAsync();

        // ── DmTinhThanhPho ──
        Task<List<TinhThanhPhoDto>> GetAllTinhThanhAsync();
        Task<TinhThanhPhoDto?> GetTinhThanhByIdAsync(int id);
        Task<int> InsertTinhThanhAsync(SaveTinhThanhPhoDto dto, string? nguoiTao);
        Task UpdateTinhThanhAsync(int id, SaveTinhThanhPhoDto dto);

        // ── DmDonVi ──
        Task<List<DonViDto>> GetAllDonViAsync();
        Task<DonViDto?> GetDonViByIdAsync(int id);
        Task<int> InsertDonViAsync(SaveDonViDto dto, string? nguoiTao);
        Task UpdateDonViAsync(int id, SaveDonViDto dto, string? nguoiCapNhat);

        // ── DmTramQuanLy ──
        Task<List<TramQuanLyDto>> GetAllTramAsync();
        Task<TramQuanLyDto?> GetTramByIdAsync(int id);
        Task<int> InsertTramAsync(SaveTramQuanLyDto dto, string? nguoiTao);
        Task UpdateTramAsync(int id, SaveTramQuanLyDto dto, string? nguoiCapNhat);

        // ── DmTuyenLuong ──
        Task<List<TuyenLuongAdminDto>> GetAllTuyenLuongAsync();
        Task<TuyenLuongAdminDto?> GetTuyenLuongByIdAsync(int id);
        Task<int> InsertTuyenLuongAsync(SaveTuyenLuongDto dto, string? nguoiTao);
        Task UpdateTuyenLuongAsync(int id, SaveTuyenLuongDto dto, string? nguoiCapNhat);

        // ── DmViTriPhaoBH ──
        Task<List<ViTriPhaoBHDto>> GetViTriByTuyenLuongAsync(int tuyenLuongId);
        Task<ViTriPhaoBHDto?> GetViTriByIdAsync(int id);
        Task<int> InsertViTriAsync(SaveViTriPhaoBHDto dto, string? nguoiTao);
        Task UpdateViTriAsync(int id, SaveViTriPhaoBHDto dto);
    }
}
