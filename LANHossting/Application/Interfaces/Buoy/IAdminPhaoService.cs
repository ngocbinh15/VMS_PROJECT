using LANHossting.Application.DTOs.Buoy;

namespace LANHossting.Application.Interfaces.Buoy
{
    public interface IAdminPhaoService
    {
        Task<AdminPhaoThongKeDto> GetThongKeAsync();

        // DmTinhThanhPho
        Task<List<TinhThanhPhoDto>> GetAllTinhThanhAsync();
        Task<(bool Ok, string? Error, int Id)> SaveTinhThanhAsync(int? id, SaveTinhThanhPhoDto dto, string? nguoiTao);

        // DmDonVi
        Task<List<DonViDto>> GetAllDonViAsync();
        Task<(bool Ok, string? Error, int Id)> SaveDonViAsync(int? id, SaveDonViDto dto, string? nguoiTao);

        // DmTramQuanLy
        Task<List<TramQuanLyDto>> GetAllTramAsync();
        Task<(bool Ok, string? Error, int Id)> SaveTramAsync(int? id, SaveTramQuanLyDto dto, string? nguoiTao);

        // DmTuyenLuong
        Task<List<TuyenLuongAdminDto>> GetAllTuyenLuongAsync();
        Task<(bool Ok, string? Error, int Id)> SaveTuyenLuongAsync(int? id, SaveTuyenLuongDto dto, string? nguoiTao);

        // DmViTriPhaoBH
        Task<List<ViTriPhaoBHDto>> GetViTriByTuyenLuongAsync(int tuyenLuongId);
        Task<(bool Ok, string? Error, int Id)> SaveViTriAsync(int? id, SaveViTriPhaoBHDto dto, string? nguoiTao);
    }
}
