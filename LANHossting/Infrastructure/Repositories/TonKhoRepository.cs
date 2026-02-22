using LANHossting.Application.DTOs;
using LANHossting.Application.Interfaces;
using LANHossting.Data;
using Microsoft.EntityFrameworkCore;

namespace LANHossting.Infrastructure.Repositories
{
    /// <summary>
    /// Repository implementation for inventory queries.
    /// 
    /// PRICING RULE (ABSOLUTE):
    ///   DonGia = VatLieu.DonGia
    ///   GiaTri = TonKho.SoLuongTon * VatLieu.DonGia
    /// 
    /// NEVER references: ChiTietPhieuNhapXuat, PhieuNhapXuat, NHAP_KHO,
    ///   OrderByDescending(NgayPhieu), GroupBy for pricing, TOP(1) for price.
    /// 
    /// Only allowed tables: TonKho, VatLieu, NhomVatLieu, DonViTinh, Kho.
    /// </summary>
    public class TonKhoRepository : ITonKhoRepository
    {
        private readonly AppDbContext _context;

        public TonKhoRepository(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Single SQL projection query joining TonKho + VatLieu + DonViTinh + NhomVatLieu.
        /// DonGia sourced from VatLieu.DonGia.
        /// GiaTri computed as SoLuongTon * VatLieu.DonGia in the projection.
        /// No nested query. No subquery. No multiple round trips.
        /// </summary>
        public async Task<List<TonKhoItemDto>> GetTonKhoByKhoIdAsync(int khoId, string? search = null)
        {
            var query = _context.TonKho
                .Where(tk => tk.KhoId == khoId)
                .Join(
                    _context.VatLieu,
                    tk => tk.VatLieuId,
                    vl => vl.Id,
                    (tk, vl) => new { tk, vl }
                )
                .Join(
                    _context.DonViTinh,
                    x => x.vl.DonViTinhId,
                    dv => dv.Id,
                    (x, dv) => new { x.tk, x.vl, dv }
                )
                .GroupJoin(
                    _context.NhomVatLieu,
                    x => x.vl.NhomVatLieuId,
                    nh => nh.Id,
                    (x, nhGroup) => new { x.tk, x.vl, x.dv, nhGroup }
                )
                .SelectMany(
                    x => x.nhGroup.DefaultIfEmpty(),
                    (x, nh) => new { x.tk, x.vl, x.dv, nh }
                );

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchTerm = search.Trim();
                query = query.Where(x =>
                    x.vl.MaVatLieu.Contains(searchTerm) ||
                    x.vl.TenVatLieu.Contains(searchTerm)
                );
            }

            return await query
                .OrderBy(x => x.vl.MaVatLieu)
                .Select(x => new TonKhoItemDto
                {
                    Id = x.tk.Id,
                    VatLieuId = x.tk.VatLieuId,
                    MaVatLieu = x.vl.MaVatLieu,
                    TenVatLieu = x.vl.TenVatLieu,
                    NhomVatLieuId = x.vl.NhomVatLieuId ?? 0,
                    NhomVatLieu = x.nh != null ? x.nh.TenNhom : "N/A",
                    DonViTinhId = x.vl.DonViTinhId,
                    DonViTinh = x.dv.TenDonVi,
                    SoLuongTon = x.tk.SoLuongTon,
                    DonGia = x.vl.DonGia,
                    GiaTri = x.tk.SoLuongTon * x.vl.DonGia
                })
                .ToListAsync();
        }

        /// <summary>
        /// Dashboard statistics: single query aggregation.
        /// TongGiaTriTonKho = SUM(TonKho.SoLuongTon * VatLieu.DonGia).
        /// </summary>
        public async Task<DashboardThongKeDto> GetDashboardThongKeAsync(int? khoId = null)
        {
            var query = _context.TonKho
                .Join(
                    _context.VatLieu,
                    tk => tk.VatLieuId,
                    vl => vl.Id,
                    (tk, vl) => new { tk, vl }
                );

            if (khoId.HasValue)
            {
                query = query.Where(x => x.tk.KhoId == khoId.Value);
            }

            var result = await query
                .GroupBy(x => 1)
                .Select(g => new DashboardThongKeDto
                {
                    TongSoVatLieu = g.Select(x => x.tk.VatLieuId).Distinct().Count(),
                    TongSoLuongTon = g.Sum(x => x.tk.SoLuongTon),
                    TongGiaTriTonKho = g.Sum(x => x.tk.SoLuongTon * x.vl.DonGia)
                })
                .FirstOrDefaultAsync();

            return result ?? new DashboardThongKeDto();
        }

        /// <summary>
        /// Active warehouse list. Only queries Kho table.
        /// </summary>
        public async Task<List<KhoDto>> GetDanhSachKhoAsync()
        {
            return await _context.Kho
                .Where(k => k.TrangThai == "Hoạt động" || k.TrangThai == "Đang sử dụng")
                .OrderBy(k => k.LoaiKho)
                .ThenBy(k => k.MaKho)
                .Select(k => new KhoDto
                {
                    Id = k.Id,
                    MaKho = k.MaKho,
                    TenKho = k.TenKho,
                    LoaiKho = k.LoaiKho,
                    DiaChi = k.DiaChi,
                    KhoMeId = k.KhoMeId
                })
                .ToListAsync();
        }
    }
}
