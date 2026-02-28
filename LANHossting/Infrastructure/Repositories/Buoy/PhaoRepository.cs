using LANHossting.Application.Interfaces.Buoy;
using LANHossting.Data;
using LANHossting.Domain.Entities.Buoy;
using Microsoft.EntityFrameworkCore;

namespace LANHossting.Infrastructure.Repositories.Buoy
{
    /// <summary>
    /// Repository triển khai truy vấn phao từ DB qua EF Core.
    /// Không chứa business logic — chỉ data access.
    /// </summary>
    public class PhaoRepository : IPhaoRepository
    {
        private readonly AppDbContext _context;

        public PhaoRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<int> CountAllAsync()
        {
            return await _context.Set<Phao>().CountAsync();
        }

        public async Task<int> CountTrenLuongAsync()
        {
            // Đọc trực tiếp từ Phao.TrangThaiHienTai — luôn phản ánh trạng thái hiện tại
            return await _context.Set<Phao>()
                .CountAsync(p => p.TrangThaiHienTai == "Trên luồng" || p.TrangThaiHienTai == "TREN_LUONG");
        }

        public async Task<int> CountDuPhongAsync()
        {
            // Đọc trực tiếp từ Phao.TrangThaiHienTai
            return await _context.Set<Phao>()
                .CountAsync(p => p.TrangThaiHienTai == "Thu hồi"  || p.TrangThaiHienTai == "Cho thuê" ||
                                 p.TrangThaiHienTai == "THU_HOI"  || p.TrangThaiHienTai == "TREN_BAI");
        }

        public async Task<int> CountSuCoAsync()
        {
            // Đọc trực tiếp từ Phao.TrangThaiHienTai
            return await _context.Set<Phao>()
                .CountAsync(p => p.TrangThaiHienTai == "Sửa chữa" || p.TrangThaiHienTai == "Mất dấu" ||
                                 p.TrangThaiHienTai == "SU_CO");
        }

        public async Task<List<Phao>> GetAllWithCurrentStatusAsync()
        {
            return await _context.Set<Phao>()
                .Include(p => p.ViTriPhaoBHHienTai)
                    .ThenInclude(v => v!.TuyenLuong)
                .AsNoTracking()
                .OrderBy(p => p.SoPhaoHienTai)
                .ToListAsync();
        }

        public async Task<Phao?> GetByIdAsync(int id)
        {
            return await _context.Set<Phao>()
                .Include(p => p.ViTriPhaoBHHienTai)
                    .ThenInclude(v => v!.TuyenLuong)
                .Include(p => p.TramQuanLy)
                .Include(p => p.TinhThanhPho)
                .Include(p => p.DonViQuanLy)
                .Include(p => p.DonViVanHanh)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<DateTime?> GetNgaySuaChuaGanNhatAsync(int phaoId)
        {
            return await _context.Set<LichSuBaoTri>()
                .Where(bt => bt.PhaoId == phaoId)
                .OrderByDescending(bt => bt.NgayBaoTri)
                .Select(bt => (DateTime?)bt.NgayBaoTri)
                .FirstOrDefaultAsync();
        }

        public async Task<LichSuHoatDongPhao?> GetHoatDongHienTaiAsync(int phaoId)
        {
            return await _context.Set<LichSuHoatDongPhao>()
                .Include(ls => ls.ViTriPhaoBH)
                    .ThenInclude(v => v!.TuyenLuong)
                .Where(ls => ls.PhaoId == phaoId && ls.NgayKetThuc == null)
                .OrderByDescending(ls => ls.NgayBatDau)
                .AsNoTracking()
                .FirstOrDefaultAsync();
        }

        public async Task<Phao?> GetByIdForEditAsync(int id)
        {
            return await _context.Set<Phao>()
                .Include(p => p.ViTriPhaoBHHienTai)
                    .ThenInclude(v => v!.TuyenLuong)
                .Include(p => p.TramQuanLy)
                .Include(p => p.TinhThanhPho)
                .Include(p => p.DonViQuanLy)
                .Include(p => p.DonViVanHanh)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var phao = await _context.Set<Phao>().FindAsync(id);
            if (phao == null) return false;

            // Cascade delete related records (DB has Restrict, handle in code)
            var lichSuHD = await _context.Set<LichSuHoatDongPhao>()
                .Where(x => x.PhaoId == id).ToListAsync();
            _context.Set<LichSuHoatDongPhao>().RemoveRange(lichSuHD);

            var lichSuBT = await _context.Set<LichSuBaoTri>()
                .Where(x => x.PhaoId == id).ToListAsync();
            _context.Set<LichSuBaoTri>().RemoveRange(lichSuBT);

            var lichSuTB = await _context.Set<LichSuThayDoiThietBi>()
                .Where(x => x.PhaoId == id).ToListAsync();
            _context.Set<LichSuThayDoiThietBi>().RemoveRange(lichSuTB);

            _context.Set<Phao>().Remove(phao);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task AddLichSuHoatDongAsync(LichSuHoatDongPhao record)
        {
            await _context.Set<LichSuHoatDongPhao>().AddAsync(record);
        }

        public async Task<DmViTriPhaoBH?> GetViTriByIdAsync(int id)
        {
            return await _context.Set<DmViTriPhaoBH>()
                .Include(v => v.TuyenLuong)
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.Id == id);
        }

        public async Task<List<LichSuHoatDongPhao>> GetLichSuHoatDongByTuyenAsync(int? tuyenLuongId)
        {
            var query = _context.Set<LichSuHoatDongPhao>()
                .Include(ls => ls.Phao)
                .Include(ls => ls.ViTriPhaoBH)
                    .ThenInclude(v => v!.TuyenLuong)
                .AsNoTracking();

            if (tuyenLuongId.HasValue)
            {
                query = query.Where(ls =>
                    ls.ViTriPhaoBH != null && ls.ViTriPhaoBH.TuyenLuongId == tuyenLuongId.Value);
            }

            return await query
                .OrderBy(ls => ls.PhaoId)
                .ThenBy(ls => ls.Nam)
                .ThenBy(ls => ls.NgayBatDau)
                .ToListAsync();
        }
    }
}
