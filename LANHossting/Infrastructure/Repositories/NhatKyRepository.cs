using LANHossting.Application.DTOs;
using LANHossting.Application.Interfaces;
using LANHossting.Data;
using Microsoft.EntityFrameworkCore;

namespace LANHossting.Infrastructure.Repositories
{
    /// <summary>
    /// Repository for Nhật Ký (audit log) read operations.
    /// Queries PhieuNhapXuat + LichSuVatLieu + related tables.
    /// ZERO write operations — all writes via GiaoDichRepository.
    /// </summary>
    public class NhatKyRepository : INhatKyRepository
    {
        private readonly AppDbContext _context;

        public NhatKyRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<NhatKyPhieuDto>> GetDanhSachPhieuAsync(NhatKyFilterDto filter)
        {
            // Base query: only completed phiếu with at least 1 LichSuVatLieu record
            var query = _context.PhieuNhapXuat
                .Include(p => p.TaiKhoan)
                .Include(p => p.KhoNguon)
                .Include(p => p.KhoNhap)
                .Where(p => p.TrangThai == "Hoàn thành")
                .AsNoTracking();

            // ── Filters ──────────────────────────────────────
            if (filter.TuNgay.HasValue)
            {
                var from = filter.TuNgay.Value.Date;
                query = query.Where(p => p.NgayThucHien >= from || p.NgayPhieu >= from);
            }

            if (filter.DenNgay.HasValue)
            {
                var to = filter.DenNgay.Value.Date.AddDays(1);
                query = query.Where(p => (p.NgayThucHien ?? p.NgayPhieu) < to);
            }

            if (filter.KhoId.HasValue && filter.KhoId.Value > 0)
            {
                var khoId = filter.KhoId.Value;
                query = query.Where(p => p.KhoNguonId == khoId || p.KhoNhapId == khoId);
            }

            if (filter.TaiKhoanId.HasValue && filter.TaiKhoanId.Value > 0)
            {
                query = query.Where(p => p.TaiKhoanId == filter.TaiKhoanId.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.LoaiThayDoi))
            {
                // Map LoaiThayDoi to LoaiPhieu
                var loaiPhieu = filter.LoaiThayDoi.ToUpper() switch
                {
                    "NHAP" => "NHAP_KHO",
                    "XUAT" => "XUAT_KHO",
                    "CHUYEN_DI" or "CHUYEN_DEN" => "CHUYEN_KHO",
                    _ => filter.LoaiThayDoi.ToUpper()
                };
                query = query.Where(p => p.LoaiPhieu == loaiPhieu);
            }

            if (!string.IsNullOrWhiteSpace(filter.SearchVatLieu))
            {
                var search = filter.SearchVatLieu.Trim().ToLower();
                query = query.Where(p => _context.ChiTietPhieuNhapXuat
                    .Any(ct => ct.PhieuNhapXuatId == p.Id &&
                        (ct.VatLieu!.MaVatLieu.ToLower().Contains(search) ||
                         ct.VatLieu.TenVatLieu.ToLower().Contains(search))));
            }

            if (filter.VatLieuId.HasValue && filter.VatLieuId.Value > 0)
            {
                var vlId = filter.VatLieuId.Value;
                query = query.Where(p => _context.ChiTietPhieuNhapXuat
                    .Any(ct => ct.PhieuNhapXuatId == p.Id && ct.VatLieuId == vlId));
            }

            // ── Count + Paginate ─────────────────────────────
            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(p => p.NgayThucHien ?? p.NgayPhieu)
                .ThenByDescending(p => p.Id)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(p => new NhatKyPhieuDto
                {
                    PhieuId = p.Id,
                    MaPhieu = p.MaPhieu,
                    LoaiPhieu = p.LoaiPhieu,
                    TenKhoNguon = p.KhoNguon != null ? p.KhoNguon.TenKho : (p.KhoNhap != null ? p.KhoNhap.TenKho : ""),
                    TenKhoNhap = p.KhoNhap != null ? p.KhoNhap.TenKho : null,
                    NguoiThucHien = p.TaiKhoan != null ? p.TaiKhoan.HoTen : "",
                    NgayThucHien = p.NgayThucHien ?? p.NgayPhieu,
                    TrangThai = p.TrangThai,
                    TongSoVatTu = p.ChiTietList.Count,
                    GhiChu = p.GhiChu
                })
                .ToListAsync();

            return new PagedResult<NhatKyPhieuDto>
            {
                Items = items,
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize
            };
        }

        public async Task<NhatKyPhieuHeaderDto?> GetChiTietPhieuAsync(int phieuId)
        {
            var phieu = await _context.PhieuNhapXuat
                .Include(p => p.TaiKhoan)
                .Include(p => p.KhoNguon)
                .Include(p => p.KhoNhap)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == phieuId);

            if (phieu == null) return null;

            // Get all LichSuVatLieu for this phieu
            var lichSu = await _context.LichSuVatLieu
                .Include(ls => ls.VatLieu).ThenInclude(vl => vl!.DonViTinh)
                .Include(ls => ls.Kho)
                .Include(ls => ls.KhoLienQuan)
                .Include(ls => ls.TaiKhoan)
                .Where(ls => ls.PhieuNhapXuatId == phieuId)
                .OrderBy(ls => ls.ThoiGian)
                .ThenBy(ls => ls.Id)
                .AsNoTracking()
                .Select(ls => new NhatKyChiTietDto
                {
                    Id = ls.Id,
                    MaVatLieu = ls.VatLieu != null ? ls.VatLieu.MaVatLieu : "",
                    TenVatLieu = ls.VatLieu != null ? ls.VatLieu.TenVatLieu : "",
                    DonViTinh = ls.VatLieu != null && ls.VatLieu.DonViTinh != null
                        ? ls.VatLieu.DonViTinh.TenDonVi
                        : "",
                    TenKho = ls.Kho != null ? ls.Kho.TenKho : "",
                    TenKhoLienQuan = ls.KhoLienQuan != null ? ls.KhoLienQuan.TenKho : null,
                    LoaiThayDoi = ls.LoaiThayDoi,
                    SoLuongTruoc = ls.SoLuongTruoc ?? 0,
                    SoLuongThayDoi = ls.SoLuongThayDoi ?? 0,
                    SoLuongSau = ls.SoLuongSau ?? 0,
                    ThoiGian = ls.ThoiGian,
                    NguoiThucHien = ls.TaiKhoan != null ? ls.TaiKhoan.HoTen : "",
                    GhiChu = ls.GhiChu
                })
                .ToListAsync();

            return new NhatKyPhieuHeaderDto
            {
                PhieuId = phieu.Id,
                MaPhieu = phieu.MaPhieu,
                LoaiPhieu = phieu.LoaiPhieu,
                TenKhoNguon = phieu.KhoNguon?.TenKho ?? phieu.KhoNhap?.TenKho ?? "",
                TenKhoNhap = phieu.KhoNhap?.TenKho,
                NguoiThucHien = phieu.TaiKhoan?.HoTen ?? "",
                NgayThucHien = phieu.NgayThucHien ?? phieu.NgayPhieu,
                TrangThai = phieu.TrangThai,
                LyDo = phieu.LyDo,
                GhiChu = phieu.GhiChu,
                ChiTiet = lichSu
            };
        }
    }
}
