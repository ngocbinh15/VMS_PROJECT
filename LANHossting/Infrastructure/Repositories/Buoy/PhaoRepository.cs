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
            // Hỗ trợ cả giá trị cũ (TREN_LUONG) và mới ("Trên luồng")
            return await _context.Set<LichSuHoatDongPhao>()
                .Where(ls => (ls.LoaiTrangThai == "TREN_LUONG" || ls.LoaiTrangThai == "Trên luồng")
                          && ls.NgayKetThuc == null)
                .Select(ls => ls.PhaoId)
                .Distinct()
                .CountAsync();
        }

        public async Task<int> CountDuPhongAsync()
        {
            // Hỗ trợ cả giá trị cũ và mới
            return await _context.Set<LichSuHoatDongPhao>()
                .Where(ls =>
                    (ls.LoaiTrangThai == "TREN_BAI"   || ls.LoaiTrangThai == "THU_HOI" ||
                     ls.LoaiTrangThai == "Thu hồi"    || ls.LoaiTrangThai == "Cho thuê")
                    && ls.NgayKetThuc == null)
                .Select(ls => ls.PhaoId)
                .Distinct()
                .CountAsync();
        }

        public async Task<int> CountSuCoAsync()
        {
            // Hỗ trợ cả giá trị cũ và mới
            return await _context.Set<LichSuHoatDongPhao>()
                .Where(ls => (ls.LoaiTrangThai == "SU_CO"    ||
                              ls.LoaiTrangThai == "Sửa chữa" ||
                              ls.LoaiTrangThai == "Mất dấu")
                          && ls.NgayKetThuc == null)
                .Select(ls => ls.PhaoId)
                .Distinct()
                .CountAsync();
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
    }
}
