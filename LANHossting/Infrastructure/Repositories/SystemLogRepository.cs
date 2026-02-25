using LANHossting.Application.DTOs;
using LANHossting.Application.Interfaces;
using LANHossting.Data;
using LANHossting.Models;
using Microsoft.EntityFrameworkCore;

namespace LANHossting.Infrastructure.Repositories
{
    /// <summary>
    /// Repository cho nhật ký hệ thống (NhatKyHeThong).
    /// Read (paginated + filtered) + Write.
    /// </summary>
    public class SystemLogRepository : ISystemLogRepository
    {
        private readonly AppDbContext _context;

        public SystemLogRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<SystemLogItemDto>> GetLogsAsync(SystemLogFilterDto filter)
        {
            var query = _context.NhatKyHeThong
                .Include(n => n.TaiKhoan)
                .AsNoTracking()
                .AsQueryable();

            // ── Filters ──────────────────────────────────────
            if (filter.TuNgay.HasValue)
            {
                var from = filter.TuNgay.Value.Date;
                query = query.Where(n => n.ThoiGian >= from);
            }

            if (filter.DenNgay.HasValue)
            {
                var to = filter.DenNgay.Value.Date.AddDays(1);
                query = query.Where(n => n.ThoiGian < to);
            }

            if (filter.TaiKhoanId.HasValue && filter.TaiKhoanId.Value > 0)
            {
                query = query.Where(n => n.TaiKhoanId == filter.TaiKhoanId.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.HanhDong))
            {
                query = query.Where(n => n.HanhDong == filter.HanhDong);
            }

            if (!string.IsNullOrWhiteSpace(filter.DoiTuong))
            {
                query = query.Where(n => n.DoiTuong == filter.DoiTuong);
            }

            // ── Count + Paginate ─────────────────────────────
            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(n => n.ThoiGian)
                .ThenByDescending(n => n.Id)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(n => new SystemLogItemDto
                {
                    Id = n.Id,
                    ThoiGian = n.ThoiGian,
                    NguoiThucHien = n.TaiKhoan != null ? n.TaiKhoan.HoTen : "",
                    HanhDong = n.HanhDong,
                    DoiTuong = n.DoiTuong,
                    DoiTuongId = n.DoiTuongId,
                    MoTa = n.MoTa,
                    DiaChiIP = n.DiaChiIP
                })
                .ToListAsync();

            return new PagedResult<SystemLogItemDto>
            {
                Items = items,
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize
            };
        }

        public async Task WriteLogAsync(int taiKhoanId, string hanhDong, string doiTuong, int? doiTuongId, string? moTa, string? ip)
        {
            var entity = new NhatKyHeThong
            {
                TaiKhoanId = taiKhoanId,
                HanhDong = hanhDong,
                DoiTuong = doiTuong,
                DoiTuongId = doiTuongId,
                MoTa = moTa,
                DiaChiIP = ip,
                ThoiGian = DateTime.Now
            };

            _context.NhatKyHeThong.Add(entity);
            await _context.SaveChangesAsync();
        }
    }
}
