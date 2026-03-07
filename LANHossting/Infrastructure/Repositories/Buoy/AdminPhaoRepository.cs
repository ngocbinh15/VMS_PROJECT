using LANHossting.Application.DTOs.Buoy;
using LANHossting.Application.Interfaces.Buoy;
using LANHossting.Data;
using Microsoft.EntityFrameworkCore;

namespace LANHossting.Infrastructure.Repositories.Buoy
{
    public class AdminPhaoRepository : IAdminPhaoRepository
    {
        private readonly AppDbContext _db;
        public AdminPhaoRepository(AppDbContext db) => _db = db;

        // ══════════════════════════════════════════
        // STATS
        // ══════════════════════════════════════════
        public async Task<AdminPhaoThongKeDto> GetThongKeAsync() => new()
        {
            TongPhao = await _db.Phao.CountAsync(),
            TongTuyenLuong = await _db.DmTuyenLuong.CountAsync(),
            TongViTri = await _db.DmViTriPhaoBH.CountAsync(),
            TongTram = await _db.DmTramQuanLy.CountAsync(),
            TongDonVi = await _db.DmDonVi.CountAsync()
        };

        // ══════════════════════════════════════════
        // DmTinhThanhPho
        // ══════════════════════════════════════════
        public async Task<List<TinhThanhPhoDto>> GetAllTinhThanhAsync() =>
            await _db.DmTinhThanhPho
                .OrderBy(x => x.ThuTuHienThi).ThenBy(x => x.TenTinh)
                .Select(x => new TinhThanhPhoDto
                {
                    Id = x.Id, MaTinh = x.MaTinh, TenTinh = x.TenTinh,
                    ThuTuHienThi = x.ThuTuHienThi, TrangThai = x.TrangThai
                }).ToListAsync();

        public async Task<TinhThanhPhoDto?> GetTinhThanhByIdAsync(int id) =>
            await _db.DmTinhThanhPho.Where(x => x.Id == id)
                .Select(x => new TinhThanhPhoDto
                {
                    Id = x.Id, MaTinh = x.MaTinh, TenTinh = x.TenTinh,
                    ThuTuHienThi = x.ThuTuHienThi, TrangThai = x.TrangThai
                }).FirstOrDefaultAsync();

        public async Task<int> InsertTinhThanhAsync(SaveTinhThanhPhoDto dto, string? nguoiTao)
        {
            var entity = new Domain.Entities.Buoy.DmTinhThanhPho
            {
                MaTinh = dto.MaTinh.Trim(),
                TenTinh = dto.TenTinh.Trim(),
                ThuTuHienThi = dto.ThuTuHienThi,
                NguoiTao = nguoiTao,
                NgayTao = DateTime.Now
            };
            _db.DmTinhThanhPho.Add(entity);
            await _db.SaveChangesAsync();
            return entity.Id;
        }

        public async Task UpdateTinhThanhAsync(int id, SaveTinhThanhPhoDto dto)
        {
            var entity = await _db.DmTinhThanhPho.FindAsync(id)
                ?? throw new KeyNotFoundException("Không tìm thấy tỉnh/thành phố");
            entity.MaTinh = dto.MaTinh.Trim();
            entity.TenTinh = dto.TenTinh.Trim();
            entity.ThuTuHienThi = dto.ThuTuHienThi;
            await _db.SaveChangesAsync();
        }

        // ══════════════════════════════════════════
        // DmDonVi
        // ══════════════════════════════════════════
        public async Task<List<DonViDto>> GetAllDonViAsync() =>
            await _db.DmDonVi
                .OrderBy(x => x.ThuTuHienThi).ThenBy(x => x.TenDonVi)
                .Select(x => new DonViDto
                {
                    Id = x.Id, MaDonVi = x.MaDonVi, TenDonVi = x.TenDonVi,
                    LoaiDonVi = x.LoaiDonVi, DiaChi = x.DiaChi,
                    SoDienThoai = x.SoDienThoai,
                    ThuTuHienThi = x.ThuTuHienThi, TrangThai = x.TrangThai
                }).ToListAsync();

        public async Task<DonViDto?> GetDonViByIdAsync(int id) =>
            await _db.DmDonVi.Where(x => x.Id == id)
                .Select(x => new DonViDto
                {
                    Id = x.Id, MaDonVi = x.MaDonVi, TenDonVi = x.TenDonVi,
                    LoaiDonVi = x.LoaiDonVi, DiaChi = x.DiaChi,
                    SoDienThoai = x.SoDienThoai,
                    ThuTuHienThi = x.ThuTuHienThi, TrangThai = x.TrangThai
                }).FirstOrDefaultAsync();

        public async Task<int> InsertDonViAsync(SaveDonViDto dto, string? nguoiTao)
        {
            var entity = new Domain.Entities.Buoy.DmDonVi
            {
                MaDonVi = dto.MaDonVi.Trim(),
                TenDonVi = dto.TenDonVi.Trim(),
                LoaiDonVi = dto.LoaiDonVi?.Trim(),
                DiaChi = dto.DiaChi?.Trim(),
                SoDienThoai = dto.SoDienThoai?.Trim(),
                ThuTuHienThi = dto.ThuTuHienThi,
                NguoiTao = nguoiTao,
                NgayTao = DateTime.Now
            };
            _db.DmDonVi.Add(entity);
            await _db.SaveChangesAsync();
            return entity.Id;
        }

        public async Task UpdateDonViAsync(int id, SaveDonViDto dto, string? nguoiCapNhat)
        {
            var entity = await _db.DmDonVi.FindAsync(id)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn vị");
            entity.MaDonVi = dto.MaDonVi.Trim();
            entity.TenDonVi = dto.TenDonVi.Trim();
            entity.LoaiDonVi = dto.LoaiDonVi?.Trim();
            entity.DiaChi = dto.DiaChi?.Trim();
            entity.SoDienThoai = dto.SoDienThoai?.Trim();
            entity.ThuTuHienThi = dto.ThuTuHienThi;
            entity.NgayCapNhat = DateTime.Now;
            entity.NguoiCapNhat = nguoiCapNhat;
            await _db.SaveChangesAsync();
        }

        // ══════════════════════════════════════════
        // DmTramQuanLy
        // ══════════════════════════════════════════
        public async Task<List<TramQuanLyDto>> GetAllTramAsync() =>
            await _db.DmTramQuanLy
                .Include(x => x.DonViChuQuan)
                .OrderBy(x => x.ThuTuHienThi).ThenBy(x => x.TenTram)
                .Select(x => new TramQuanLyDto
                {
                    Id = x.Id, MaTram = x.MaTram, TenTram = x.TenTram,
                    DonViChuQuanId = x.DonViChuQuanId,
                    TenDonViChuQuan = x.DonViChuQuan != null ? x.DonViChuQuan.TenDonVi : null,
                    DiaDiem = x.DiaDiem, SoDienThoai = x.SoDienThoai,
                    ThuTuHienThi = x.ThuTuHienThi, TrangThai = x.TrangThai
                }).ToListAsync();

        public async Task<TramQuanLyDto?> GetTramByIdAsync(int id) =>
            await _db.DmTramQuanLy.Include(x => x.DonViChuQuan).Where(x => x.Id == id)
                .Select(x => new TramQuanLyDto
                {
                    Id = x.Id, MaTram = x.MaTram, TenTram = x.TenTram,
                    DonViChuQuanId = x.DonViChuQuanId,
                    TenDonViChuQuan = x.DonViChuQuan != null ? x.DonViChuQuan.TenDonVi : null,
                    DiaDiem = x.DiaDiem, SoDienThoai = x.SoDienThoai,
                    ThuTuHienThi = x.ThuTuHienThi, TrangThai = x.TrangThai
                }).FirstOrDefaultAsync();

        public async Task<int> InsertTramAsync(SaveTramQuanLyDto dto, string? nguoiTao)
        {
            var entity = new Domain.Entities.Buoy.DmTramQuanLy
            {
                MaTram = dto.MaTram.Trim(),
                TenTram = dto.TenTram.Trim(),
                DonViChuQuanId = dto.DonViChuQuanId,
                DiaDiem = dto.DiaDiem?.Trim(),
                SoDienThoai = dto.SoDienThoai?.Trim(),
                ThuTuHienThi = dto.ThuTuHienThi,
                NguoiTao = nguoiTao,
                NgayTao = DateTime.Now
            };
            _db.DmTramQuanLy.Add(entity);
            await _db.SaveChangesAsync();
            return entity.Id;
        }

        public async Task UpdateTramAsync(int id, SaveTramQuanLyDto dto, string? nguoiCapNhat)
        {
            var entity = await _db.DmTramQuanLy.FindAsync(id)
                ?? throw new KeyNotFoundException("Không tìm thấy trạm quản lý");
            entity.MaTram = dto.MaTram.Trim();
            entity.TenTram = dto.TenTram.Trim();
            entity.DonViChuQuanId = dto.DonViChuQuanId;
            entity.DiaDiem = dto.DiaDiem?.Trim();
            entity.SoDienThoai = dto.SoDienThoai?.Trim();
            entity.ThuTuHienThi = dto.ThuTuHienThi;
            entity.NgayCapNhat = DateTime.Now;
            entity.NguoiCapNhat = nguoiCapNhat;
            await _db.SaveChangesAsync();
        }

        // ══════════════════════════════════════════
        // DmTuyenLuong
        // ══════════════════════════════════════════
        public async Task<List<TuyenLuongAdminDto>> GetAllTuyenLuongAsync() =>
            await _db.DmTuyenLuong
                .OrderBy(x => x.ThuTuHienThi).ThenBy(x => x.TenTuyen)
                .Select(x => new TuyenLuongAdminDto
                {
                    Id = x.Id, MaTuyen = x.MaTuyen, TenTuyen = x.TenTuyen,
                    MoTa = x.MoTa, ThuTuHienThi = x.ThuTuHienThi, TrangThai = x.TrangThai,
                    SoViTri = x.ViTriPhaoList.Count
                }).ToListAsync();

        public async Task<TuyenLuongAdminDto?> GetTuyenLuongByIdAsync(int id) =>
            await _db.DmTuyenLuong.Where(x => x.Id == id)
                .Select(x => new TuyenLuongAdminDto
                {
                    Id = x.Id, MaTuyen = x.MaTuyen, TenTuyen = x.TenTuyen,
                    MoTa = x.MoTa, ThuTuHienThi = x.ThuTuHienThi, TrangThai = x.TrangThai,
                    SoViTri = x.ViTriPhaoList.Count
                }).FirstOrDefaultAsync();

        public async Task<int> InsertTuyenLuongAsync(SaveTuyenLuongDto dto, string? nguoiTao)
        {
            var entity = new Domain.Entities.Buoy.DmTuyenLuong
            {
                MaTuyen = dto.MaTuyen.Trim(),
                TenTuyen = dto.TenTuyen.Trim(),
                MoTa = dto.MoTa?.Trim(),
                ThuTuHienThi = dto.ThuTuHienThi,
                NguoiTao = nguoiTao,
                NgayTao = DateTime.Now
            };
            _db.DmTuyenLuong.Add(entity);
            await _db.SaveChangesAsync();
            return entity.Id;
        }

        public async Task UpdateTuyenLuongAsync(int id, SaveTuyenLuongDto dto, string? nguoiCapNhat)
        {
            var entity = await _db.DmTuyenLuong.FindAsync(id)
                ?? throw new KeyNotFoundException("Không tìm thấy tuyến luồng");
            entity.MaTuyen = dto.MaTuyen.Trim();
            entity.TenTuyen = dto.TenTuyen.Trim();
            entity.MoTa = dto.MoTa?.Trim();
            entity.ThuTuHienThi = dto.ThuTuHienThi;
            entity.NgayCapNhat = DateTime.Now;
            entity.NguoiCapNhat = nguoiCapNhat;
            await _db.SaveChangesAsync();
        }

        // ══════════════════════════════════════════
        // DmViTriPhaoBH
        // ══════════════════════════════════════════
        public async Task<List<ViTriPhaoBHDto>> GetViTriByTuyenLuongAsync(int tuyenLuongId) =>
            await _db.DmViTriPhaoBH
                .Where(x => x.TuyenLuongId == tuyenLuongId)
                .Include(x => x.TuyenLuong)
                .OrderBy(x => x.ThuTuHienThi).ThenBy(x => x.SoViTri)
                .Select(x => new ViTriPhaoBHDto
                {
                    Id = x.Id, TuyenLuongId = x.TuyenLuongId,
                    TenTuyen = x.TuyenLuong != null ? x.TuyenLuong.TenTuyen : null,
                    SoViTri = x.SoViTri, MaPhaoBH = x.MaPhaoBH,
                    ToaDoThietKe = x.ToaDoThietKe, MoTa = x.MoTa,
                    ThuTuHienThi = x.ThuTuHienThi, TrangThai = x.TrangThai
                }).ToListAsync();

        public async Task<ViTriPhaoBHDto?> GetViTriByIdAsync(int id) =>
            await _db.DmViTriPhaoBH.Include(x => x.TuyenLuong).Where(x => x.Id == id)
                .Select(x => new ViTriPhaoBHDto
                {
                    Id = x.Id, TuyenLuongId = x.TuyenLuongId,
                    TenTuyen = x.TuyenLuong != null ? x.TuyenLuong.TenTuyen : null,
                    SoViTri = x.SoViTri, MaPhaoBH = x.MaPhaoBH,
                    ToaDoThietKe = x.ToaDoThietKe, MoTa = x.MoTa,
                    ThuTuHienThi = x.ThuTuHienThi, TrangThai = x.TrangThai
                }).FirstOrDefaultAsync();

        public async Task<int> InsertViTriAsync(SaveViTriPhaoBHDto dto, string? nguoiTao)
        {
            var entity = new Domain.Entities.Buoy.DmViTriPhaoBH
            {
                TuyenLuongId = dto.TuyenLuongId,
                SoViTri = dto.SoViTri.Trim(),
                MaPhaoBH = dto.MaPhaoBH.Trim(),
                ToaDoThietKe = dto.ToaDoThietKe?.Trim(),
                MoTa = dto.MoTa?.Trim(),
                ThuTuHienThi = dto.ThuTuHienThi,
                NguoiTao = nguoiTao,
                NgayTao = DateTime.Now
            };
            _db.DmViTriPhaoBH.Add(entity);
            await _db.SaveChangesAsync();
            return entity.Id;
        }

        public async Task UpdateViTriAsync(int id, SaveViTriPhaoBHDto dto)
        {
            var entity = await _db.DmViTriPhaoBH.FindAsync(id)
                ?? throw new KeyNotFoundException("Không tìm thấy vị trí phao");
            entity.TuyenLuongId = dto.TuyenLuongId;
            entity.SoViTri = dto.SoViTri.Trim();
            entity.MaPhaoBH = dto.MaPhaoBH.Trim();
            entity.ToaDoThietKe = dto.ToaDoThietKe?.Trim();
            entity.MoTa = dto.MoTa?.Trim();
            entity.ThuTuHienThi = dto.ThuTuHienThi;
            await _db.SaveChangesAsync();
        }
    }
}
