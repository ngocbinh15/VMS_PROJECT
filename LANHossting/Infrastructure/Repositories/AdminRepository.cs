using LANHossting.Application.DTOs;
using LANHossting.Application.Interfaces;
using LANHossting.Data;
using LANHossting.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace LANHossting.Infrastructure.Repositories
{
    /// <summary>
    /// Repository cho Admin module — quản trị tài khoản + vật liệu.
    /// Pure data access, ZERO business rules.
    /// </summary>
    public class AdminRepository : IAdminRepository
    {
        private readonly AppDbContext _context;

        public AdminRepository(AppDbContext context)
        {
            _context = context;
        }

        // ══════════════════════════════════════════
        // TÀI KHOẢN
        // ══════════════════════════════════════════

        public async Task<List<TaiKhoanListDto>> GetDanhSachTaiKhoanAsync()
        {
            return await _context.TaiKhoan
                .Include(t => t.VaiTro)
                .OrderByDescending(t => t.NgayTao)
                .Select(t => new TaiKhoanListDto
                {
                    Id = t.Id,
                    TenDangNhap = t.TenDangNhap,
                    HoTen = t.HoTen,
                    Email = t.Email,
                    SoDienThoai = t.SoDienThoai,
                    MaVaiTro = t.VaiTro != null ? t.VaiTro.MaVaiTro : "",
                    TenVaiTro = t.VaiTro != null ? t.VaiTro.TenVaiTro : "",
                    TrangThai = t.TrangThai,
                    NgayTao = t.NgayTao
                })
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<TaiKhoanListDto?> GetTaiKhoanByIdAsync(int id)
        {
            return await _context.TaiKhoan
                .Include(t => t.VaiTro)
                .Where(t => t.Id == id)
                .Select(t => new TaiKhoanListDto
                {
                    Id = t.Id,
                    TenDangNhap = t.TenDangNhap,
                    HoTen = t.HoTen,
                    Email = t.Email,
                    SoDienThoai = t.SoDienThoai,
                    MaVaiTro = t.VaiTro != null ? t.VaiTro.MaVaiTro : "",
                    TenVaiTro = t.VaiTro != null ? t.VaiTro.TenVaiTro : "",
                    TrangThai = t.TrangThai,
                    NgayTao = t.NgayTao
                })
                .AsNoTracking()
                .FirstOrDefaultAsync();
        }

        public async Task<bool> TenDangNhapExistsAsync(string tenDangNhap, int? excludeId = null)
        {
            var query = _context.TaiKhoan
                .Where(t => t.TenDangNhap == tenDangNhap);

            if (excludeId.HasValue)
                query = query.Where(t => t.Id != excludeId.Value);

            return await query.AnyAsync();
        }

        public async Task<int> CreateTaiKhoanAsync(CreateTaiKhoanDto dto, int nguoiTaoId)
        {
            var entity = new TaiKhoan
            {
                TenDangNhap = dto.TenDangNhap.Trim(),
                MatKhau = HashPassword(dto.MatKhau),
                HoTen = dto.HoTen.Trim(),
                Email = dto.Email?.Trim(),
                SoDienThoai = dto.SoDienThoai?.Trim(),
                VaiTroId = dto.VaiTroId,
                TrangThai = "Hoạt động",
                NgayTao = DateTime.Now,
                NgayCapNhat = DateTime.Now,
                NguoiTao = nguoiTaoId
            };

            _context.TaiKhoan.Add(entity);
            await _context.SaveChangesAsync();
            return entity.Id;
        }

        public async Task<bool> UpdateTaiKhoanAsync(UpdateTaiKhoanDto dto)
        {
            var entity = await _context.TaiKhoan.FindAsync(dto.Id);
            if (entity == null) return false;

            entity.HoTen = dto.HoTen.Trim();
            entity.Email = dto.Email?.Trim();
            entity.SoDienThoai = dto.SoDienThoai?.Trim();
            entity.VaiTroId = dto.VaiTroId;
            entity.NgayCapNhat = DateTime.Now;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteTaiKhoanAsync(int id)
        {
            var entity = await _context.TaiKhoan.FindAsync(id);
            if (entity == null) return false;

            // Hard delete: xóa vĩnh viễn khỏi database
            _context.TaiKhoan.Remove(entity);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ToggleTrangThaiAsync(int id)
        {
            var entity = await _context.TaiKhoan.FindAsync(id);
            if (entity == null) return false;

            entity.TrangThai = entity.TrangThai == "Hoạt động" ? "Bị khóa" : "Hoạt động";
            entity.NgayCapNhat = DateTime.Now;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ResetPasswordAsync(int id, string newPassword)
        {
            var entity = await _context.TaiKhoan.FindAsync(id);
            if (entity == null) return false;

            entity.MatKhau = HashPassword(newPassword);
            entity.NgayCapNhat = DateTime.Now;
            await _context.SaveChangesAsync();
            return true;
        }

        // ══════════════════════════════════════════
        // VAI TRÒ
        // ══════════════════════════════════════════

        public async Task<List<VaiTroDropdownDto>> GetDanhSachVaiTroAsync()
        {
            return await _context.VaiTro
                .OrderBy(v => v.Id)
                .Select(v => new VaiTroDropdownDto
                {
                    Id = v.Id,
                    MaVaiTro = v.MaVaiTro,
                    TenVaiTro = v.TenVaiTro
                })
                .AsNoTracking()
                .ToListAsync();
        }

        // ══════════════════════════════════════════
        // VẬT LIỆU
        // ══════════════════════════════════════════

        public async Task<List<VatLieuListDto>> GetDanhSachVatLieuAsync()
        {
            return await _context.VatLieu
                .Include(v => v.NhomVatLieu)
                .Include(v => v.DonViTinh)
                .OrderBy(v => v.MaVatLieu)
                .Select(v => new VatLieuListDto
                {
                    Id = v.Id,
                    MaVatLieu = v.MaVatLieu,
                    TenVatLieu = v.TenVatLieu,
                    TenNhomVatLieu = v.NhomVatLieu != null ? v.NhomVatLieu.TenNhom : null,
                    NhomVatLieuId = v.NhomVatLieuId,
                    TenDonViTinh = v.DonViTinh != null ? v.DonViTinh.TenDonVi : "",
                    DonViTinhId = v.DonViTinhId,
                    DonGia = v.DonGia,
                    MucToiThieu = v.MucToiThieu,
                    MucToiDa = v.MucToiDa,
                    TrangThai = v.TrangThai ?? "Hoạt động"
                })
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<bool> MaVatLieuExistsAsync(string maVatLieu, int excludeId)
        {
            return await _context.VatLieu
                .AnyAsync(v => v.MaVatLieu == maVatLieu && v.Id != excludeId);
        }

        public async Task<bool> UpdateVatLieuAsync(UpdateVatLieuDto dto)
        {
            var entity = await _context.VatLieu.FindAsync(dto.Id);
            if (entity == null) return false;

            entity.MaVatLieu = dto.MaVatLieu.Trim();
            entity.TenVatLieu = dto.TenVatLieu.Trim();
            entity.NhomVatLieuId = dto.NhomVatLieuId;
            entity.DonViTinhId = dto.DonViTinhId;
            entity.DonGia = dto.DonGia;
            entity.MucToiThieu = dto.MucToiThieu;
            entity.MucToiDa = dto.MucToiDa;
            entity.MoTa = dto.MoTa?.Trim();

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteVatLieuAsync(int id)
        {
            var entity = await _context.VatLieu.FindAsync(id);
            if (entity == null) return false;

            // Xóa các bản ghi TonKho có SoLuongTon = 0 (dọn dẹp trước khi xóa)
            var tonKhoZero = await _context.TonKho
                .Where(tk => tk.VatLieuId == id && tk.SoLuongTon == 0)
                .ToListAsync();
            if (tonKhoZero.Any())
                _context.TonKho.RemoveRange(tonKhoZero);

            // Hard delete: xóa vĩnh viễn khỏi database
            _context.VatLieu.Remove(entity);
            await _context.SaveChangesAsync();
            return true;
        }

        // ══════════════════════════════════════════
        // FK CONSTRAINT CHECKS
        // ══════════════════════════════════════════

        public async Task<bool> TaiKhoanHasReferencesAsync(int id)
        {
            // Kiểm tra tất cả bảng có FK đến TaiKhoan
            var hasPhienLamViec = await _context.PhienLamViec.AnyAsync(p => p.TaiKhoanId == id);
            if (hasPhienLamViec) return true;

            var hasPhieuNhapXuat = await _context.PhieuNhapXuat
                .AnyAsync(p => p.TaiKhoanId == id || p.NguoiDuyet == id);
            if (hasPhieuNhapXuat) return true;

            var hasLichSuVatLieu = await _context.LichSuVatLieu.AnyAsync(l => l.TaiKhoanId == id);
            if (hasLichSuVatLieu) return true;

            var hasNhatKyHeThong = await _context.NhatKyHeThong.AnyAsync(n => n.TaiKhoanId == id);
            if (hasNhatKyHeThong) return true;

            var hasKhoPhuTrach = await _context.Kho.AnyAsync(k => k.NguoiPhuTrach == id);
            if (hasKhoPhuTrach) return true;

            return false;
        }

        public async Task<bool> VatLieuHasReferencesAsync(int id)
        {
            // Kiểm tra tất cả bảng có FK đến VatLieu
            var hasTonKho = await _context.TonKho.AnyAsync(tk => tk.VatLieuId == id && tk.SoLuongTon > 0);
            if (hasTonKho) return true;

            var hasChiTietPhieu = await _context.ChiTietPhieuNhapXuat.AnyAsync(ct => ct.VatLieuId == id);
            if (hasChiTietPhieu) return true;

            var hasLichSu = await _context.LichSuVatLieu.AnyAsync(l => l.VatLieuId == id);
            if (hasLichSu) return true;

            return false;
        }

        // ══════════════════════════════════════════
        // HELPERS
        // ══════════════════════════════════════════

        /// <summary>
        /// SHA256 hash — cùng logic với LoginController.HashPassword.
        /// </summary>
        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            var sb = new StringBuilder();
            foreach (byte b in bytes)
                sb.Append(b.ToString("x2"));
            return sb.ToString();
        }
    }
}
