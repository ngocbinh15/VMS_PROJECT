using LANHossting.Application.DTOs;
using LANHossting.Application.Interfaces;
using LANHossting.Data;
using LANHossting.Models;
using Microsoft.EntityFrameworkCore;

namespace LANHossting.Infrastructure.Repositories
{
    /// <summary>
    /// Repository for VatLieu write + lookup operations.
    /// All DB access is here — controllers and services never touch DbContext.
    /// </summary>
    public class VatLieuRepository : IVatLieuRepository
    {
        private readonly AppDbContext _context;

        public VatLieuRepository(AppDbContext context)
        {
            _context = context;
        }

        /// <inheritdoc />
        public async Task<bool> ExistsAsync(string maVatLieu, string tenVatLieu)
        {
            return await _context.VatLieu.AnyAsync(v =>
                v.MaVatLieu == maVatLieu ||
                v.TenVatLieu.ToLower() == tenVatLieu.ToLower());
        }

        /// <inheritdoc />
        public async Task CreateAsync(CreateVatLieuDto dto)
        {
            var vatLieu = new VatLieu
            {
                MaVatLieu = dto.MaVatLieu.Trim(),
                TenVatLieu = dto.TenVatLieu.Trim(),
                NhomVatLieuId = dto.NhomVatLieuId,
                DonViTinhId = dto.DonViTinhId,
                DonGia = dto.DonGia,
                MoTa = dto.MoTa?.Trim(),
                QuyDinhBaoQuan = dto.QuyDinhBaoQuan?.Trim(),
                MucToiThieu = dto.MucToiThieu,   // Default already applied by Service layer
                TrangThai = "Đang sử dụng",
                NgayTao = DateTime.Now
            };

            _context.VatLieu.Add(vatLieu);
            await _context.SaveChangesAsync();

            // Create TonKho = 0 ONLY for the specified warehouse (dto.KhoId).
            // Other warehouses must NOT see this material until explicit nhập kho / điều chuyển.
            _context.TonKho.Add(new TonKho
            {
                KhoId = dto.KhoId,
                VatLieuId = vatLieu.Id,
                SoLuongTon = 0,
                SoLuongDatCho = 0,
                NgayCapNhat = DateTime.Now
            });

            await _context.SaveChangesAsync();
        }

        /// <inheritdoc />
        public async Task<List<DropdownItemDto>> GetNhomVatLieuAsync()
        {
            return await _context.NhomVatLieu
                .OrderBy(n => n.TenNhom)
                .Select(n => new DropdownItemDto
                {
                    Id = n.Id,
                    Ma = n.MaNhom,
                    Ten = n.TenNhom
                })
                .ToListAsync();
        }

        /// <inheritdoc />
        public async Task<List<DropdownItemDto>> GetDonViTinhAsync()
        {
            return await _context.DonViTinh
                .OrderBy(d => d.TenDonVi)
                .Select(d => new DropdownItemDto
                {
                    Id = d.Id,
                    Ma = d.MaDonVi,
                    Ten = d.TenDonVi
                })
                .ToListAsync();
        }
    }
}
