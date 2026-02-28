using LANHossting.Application.Interfaces.Buoy;
using LANHossting.Data;
using LANHossting.Domain.Entities.Buoy;
using Microsoft.EntityFrameworkCore;

namespace LANHossting.Infrastructure.Repositories.Buoy
{
    /// <summary>
    /// Repository cho Tuyến luồng.
    /// Phục vụ chức năng Phân luồng trong tương lai.
    /// </summary>
    public class TuyenLuongRepository : ITuyenLuongRepository
    {
        private readonly AppDbContext _context;

        public TuyenLuongRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<DmTuyenLuong>> GetAllActiveAsync()
        {
            return await _context.Set<DmTuyenLuong>()
                .Where(t => t.TrangThai == "Hoạt động")
                .Include(t => t.ViTriPhaoList)
                .OrderBy(t => t.ThuTuHienThi)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<DmTuyenLuong?> GetByIdWithViTriAsync(int id)
        {
            return await _context.Set<DmTuyenLuong>()
                .Include(t => t.ViTriPhaoList.OrderBy(v => v.ThuTuHienThi))
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == id);
        }
    }
}
