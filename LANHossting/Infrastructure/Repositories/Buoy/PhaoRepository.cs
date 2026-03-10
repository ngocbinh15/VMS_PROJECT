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

        public async Task<List<LichSuHoatDongPhao>> GetLichSuHoatDongByTuyenAsync(List<int>? tuyenLuongIds)
        {
            var query = _context.Set<LichSuHoatDongPhao>()
                .Include(ls => ls.Phao)
                .Include(ls => ls.ViTriPhaoBH)
                    .ThenInclude(v => v!.TuyenLuong)
                .AsNoTracking();

            if (tuyenLuongIds != null && tuyenLuongIds.Count > 0)
            {
                // Lấy danh sách PhaoId đã từng hoạt động trên các tuyến luồng đã chọn
                var phaoIdsInTuyen = await _context.Set<LichSuHoatDongPhao>()
                    .AsNoTracking()
                    .Where(ls => ls.ViTriPhaoBH != null
                              && tuyenLuongIds.Contains(ls.ViTriPhaoBH.TuyenLuongId))
                    .Select(ls => ls.PhaoId)
                    .Distinct()
                    .ToListAsync();

                // Chỉ lấy bản ghi có vị trí thuộc các tuyến đã chọn,
                // hoặc bản ghi không có vị trí (Thu hồi, Trên bãi...) của phao thuộc các tuyến đó
                query = query.Where(ls => phaoIdsInTuyen.Contains(ls.PhaoId)
                    && (ls.ViTriPhaoBHId == null
                        || (ls.ViTriPhaoBH != null && tuyenLuongIds.Contains(ls.ViTriPhaoBH.TuyenLuongId))));
            }

            return await query
                .OrderBy(ls => ls.PhaoId)
                .ThenBy(ls => ls.Nam)
                .ThenBy(ls => ls.NgayBatDau)
                .ToListAsync();
        }

        /// <inheritdoc />
        public async Task<string?> CheckViTriTrungAsync(int viTriId, int excludePhaoId, DateTime ngaySuKien)
        {
            // Kiểm tra overlap theo khoảng thời gian thực tế:
            // - Mỗi bản ghi có NgayBatDau (start) và effective end = NgayKetThuc nếu có,
            //   nếu không thì lấy NgayBatDau của bản ghi tiếp theo của cùng phao (phao đã rời vị trí),
            //   nếu không có bản ghi tiếp theo thì phao vẫn đang ở vị trí đó (end = null → vô hạn).
            var allRecords = _context.Set<Domain.Entities.Buoy.LichSuHoatDongPhao>().AsNoTracking();

            // Lấy các bản ghi tại vị trí này của phao khác
            var candidateRecords = await allRecords
                .Where(ls => ls.ViTriPhaoBHId == viTriId && ls.PhaoId != excludePhaoId)
                .OrderBy(ls => ls.NgayBatDau)
                .ToListAsync();

            if (!candidateRecords.Any()) return null;

            // Lấy tất cả bản ghi của các phao liên quan để tính effective end
            var phaoIds = candidateRecords.Select(r => r.PhaoId).Distinct().ToList();
            var allRecordsOfPhaos = await allRecords
                .Where(ls => phaoIds.Contains(ls.PhaoId))
                .OrderBy(ls => ls.PhaoId)
                .ThenBy(ls => ls.NgayBatDau)
                .ToListAsync();

            // Tính effective end cho từng bản ghi candidate
            foreach (var record in candidateRecords)
            {
                // Effective end = NgayKetThuc nếu đã set
                DateTime? effectiveEnd = record.NgayKetThuc;

                if (effectiveEnd == null)
                {
                    // Tìm bản ghi tiếp theo của cùng phao (theo NgayBatDau)
                    var nextRecord = allRecordsOfPhaos
                        .Where(r => r.PhaoId == record.PhaoId && r.NgayBatDau > record.NgayBatDau)
                        .OrderBy(r => r.NgayBatDau)
                        .FirstOrDefault();

                    if (nextRecord != null)
                    {
                        // Phao đã rời vị trí này → effective end = ngày bắt đầu bản ghi tiếp theo
                        effectiveEnd = nextRecord.NgayBatDau;
                    }
                    // Nếu không có bản ghi tiếp theo → effectiveEnd = null → phao vẫn ở đây
                }

                // Overlap check: [record.NgayBatDau, effectiveEnd) ∩ [ngaySuKien, ∞)
                // Overlap xảy ra khi: record.NgayBatDau < ∞ (luôn đúng) AND (effectiveEnd > ngaySuKien OR effectiveEnd == null)
                bool hasOverlap = effectiveEnd == null || effectiveEnd > ngaySuKien;

                if (hasOverlap)
                {
                    // Tìm tên phao để hiển thị lỗi
                    var phao = await _context.Set<Domain.Entities.Buoy.Phao>()
                        .AsNoTracking()
                        .Where(p => p.Id == record.PhaoId)
                        .Select(p => p.MaPhaoDayDu)
                        .FirstOrDefaultAsync();
                    return phao;
                }
            }

            return null;
        }

        /// <inheritdoc />
        public async Task<List<LichSuHoatDongPhao>> GetLatestStatusBeforeTimeAsync(DateTime thoiDiem)
        {
            // Load tất cả bản ghi lịch sử có NgayBatDau <= thời điểm kèm navigation
            var allBefore = await _context.Set<LichSuHoatDongPhao>()
                .Where(ls => ls.NgayBatDau <= thoiDiem)
                .Include(ls => ls.ViTriPhaoBH)
                    .ThenInclude(v => v!.TuyenLuong)
                .AsNoTracking()
                .ToListAsync();

            // Group in-memory: lấy bản ghi mới nhất (NgayBatDau lớn nhất, Id cao nhất) cho mỗi PhaoId
            return allBefore
                .GroupBy(ls => ls.PhaoId)
                .Select(g => g
                    .OrderByDescending(ls => ls.NgayBatDau)
                    .ThenByDescending(ls => ls.Id)
                    .First())
                .ToList();
        }

        /// <inheritdoc />
        public async Task AddPhaoAsync(Phao phao)
        {
            _context.Set<Phao>().Add(phao);
            await _context.SaveChangesAsync();
        }

        /// <inheritdoc />
        public async Task<bool> ExistsByMaPhaoAsync(string maPhaoDayDu, int? excludeId = null)
        {
            var query = _context.Set<Phao>().Where(p => p.MaPhaoDayDu == maPhaoDayDu);
            if (excludeId.HasValue)
                query = query.Where(p => p.Id != excludeId.Value);
            return await query.AnyAsync();
        }

        /// <inheritdoc />
        public async Task<bool> ExistsByTenPhaoAsync(string tenPhao, int? excludeId = null)
        {
            var query = _context.Set<Phao>().Where(p => p.TenPhao == tenPhao);
            if (excludeId.HasValue)
                query = query.Where(p => p.Id != excludeId.Value);
            return await query.AnyAsync();
        }

        /// <inheritdoc />
        public async Task<bool> ExistsByKyHieuTaiSanAsync(string kyHieu, int? excludeId = null)
        {
            var query = _context.Set<Phao>().Where(p => p.KyHieuTaiSan == kyHieu);
            if (excludeId.HasValue)
                query = query.Where(p => p.Id != excludeId.Value);
            return await query.AnyAsync();
        }
    }
}
