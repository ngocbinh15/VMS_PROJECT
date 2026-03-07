using LANHossting.Application.DTOs.Buoy;
using LANHossting.Application.Interfaces.Buoy;

namespace LANHossting.Application.Services.Buoy
{
    public class AdminPhaoService : IAdminPhaoService
    {
        private readonly IAdminPhaoRepository _repo;
        public AdminPhaoService(IAdminPhaoRepository repo) => _repo = repo;

        public Task<AdminPhaoThongKeDto> GetThongKeAsync() => _repo.GetThongKeAsync();

        // ══════════════════════════════════════════
        // DmTinhThanhPho
        // ══════════════════════════════════════════
        public Task<List<TinhThanhPhoDto>> GetAllTinhThanhAsync() => _repo.GetAllTinhThanhAsync();

        public async Task<(bool Ok, string? Error, int Id)> SaveTinhThanhAsync(int? id, SaveTinhThanhPhoDto dto, string? nguoiTao)
        {
            if (string.IsNullOrWhiteSpace(dto.MaTinh))
                return (false, "Mã tỉnh không được để trống", 0);
            if (string.IsNullOrWhiteSpace(dto.TenTinh))
                return (false, "Tên tỉnh không được để trống", 0);

            if (id.HasValue)
            {
                await _repo.UpdateTinhThanhAsync(id.Value, dto);
                return (true, null, id.Value);
            }
            var newId = await _repo.InsertTinhThanhAsync(dto, nguoiTao);
            return (true, null, newId);
        }

        // ══════════════════════════════════════════
        // DmDonVi
        // ══════════════════════════════════════════
        public Task<List<DonViDto>> GetAllDonViAsync() => _repo.GetAllDonViAsync();

        public async Task<(bool Ok, string? Error, int Id)> SaveDonViAsync(int? id, SaveDonViDto dto, string? nguoiTao)
        {
            if (string.IsNullOrWhiteSpace(dto.MaDonVi))
                return (false, "Mã đơn vị không được để trống", 0);
            if (string.IsNullOrWhiteSpace(dto.TenDonVi))
                return (false, "Tên đơn vị không được để trống", 0);

            if (id.HasValue)
            {
                await _repo.UpdateDonViAsync(id.Value, dto, nguoiTao);
                return (true, null, id.Value);
            }
            var newId = await _repo.InsertDonViAsync(dto, nguoiTao);
            return (true, null, newId);
        }

        // ══════════════════════════════════════════
        // DmTramQuanLy
        // ══════════════════════════════════════════
        public Task<List<TramQuanLyDto>> GetAllTramAsync() => _repo.GetAllTramAsync();

        public async Task<(bool Ok, string? Error, int Id)> SaveTramAsync(int? id, SaveTramQuanLyDto dto, string? nguoiTao)
        {
            if (string.IsNullOrWhiteSpace(dto.MaTram))
                return (false, "Mã trạm không được để trống", 0);
            if (string.IsNullOrWhiteSpace(dto.TenTram))
                return (false, "Tên trạm không được để trống", 0);

            if (id.HasValue)
            {
                await _repo.UpdateTramAsync(id.Value, dto, nguoiTao);
                return (true, null, id.Value);
            }
            var newId = await _repo.InsertTramAsync(dto, nguoiTao);
            return (true, null, newId);
        }

        // ══════════════════════════════════════════
        // DmTuyenLuong
        // ══════════════════════════════════════════
        public Task<List<TuyenLuongAdminDto>> GetAllTuyenLuongAsync() => _repo.GetAllTuyenLuongAsync();

        public async Task<(bool Ok, string? Error, int Id)> SaveTuyenLuongAsync(int? id, SaveTuyenLuongDto dto, string? nguoiTao)
        {
            if (string.IsNullOrWhiteSpace(dto.MaTuyen))
                return (false, "Mã tuyến không được để trống", 0);
            if (string.IsNullOrWhiteSpace(dto.TenTuyen))
                return (false, "Tên tuyến không được để trống", 0);

            if (id.HasValue)
            {
                await _repo.UpdateTuyenLuongAsync(id.Value, dto, nguoiTao);
                return (true, null, id.Value);
            }
            var newId = await _repo.InsertTuyenLuongAsync(dto, nguoiTao);
            return (true, null, newId);
        }

        // ══════════════════════════════════════════
        // DmViTriPhaoBH
        // ══════════════════════════════════════════
        public Task<List<ViTriPhaoBHDto>> GetViTriByTuyenLuongAsync(int tuyenLuongId) =>
            _repo.GetViTriByTuyenLuongAsync(tuyenLuongId);

        public async Task<(bool Ok, string? Error, int Id)> SaveViTriAsync(int? id, SaveViTriPhaoBHDto dto, string? nguoiTao)
        {
            if (dto.TuyenLuongId <= 0)
                return (false, "Phải chọn tuyến luồng", 0);
            if (string.IsNullOrWhiteSpace(dto.SoViTri))
                return (false, "Số vị trí không được để trống", 0);
            if (string.IsNullOrWhiteSpace(dto.MaPhaoBH))
                return (false, "Mã phao BH không được để trống", 0);

            if (id.HasValue)
            {
                await _repo.UpdateViTriAsync(id.Value, dto);
                return (true, null, id.Value);
            }
            var newId = await _repo.InsertViTriAsync(dto, nguoiTao);
            return (true, null, newId);
        }
    }
}
