using Microsoft.EntityFrameworkCore;
using LANHossting.Models;
using BuoyEntities = LANHossting.Domain.Entities.Buoy;

namespace LANHossting.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // ============================================
        // BUOY MODULE - Quản lý phao (Domain Entities)
        // ============================================
        public DbSet<BuoyEntities.DmTuyenLuong> DmTuyenLuong { get; set; }
        public DbSet<BuoyEntities.DmViTriPhaoBH> DmViTriPhaoBH { get; set; }
        public DbSet<BuoyEntities.DmDonVi> DmDonVi { get; set; }
        public DbSet<BuoyEntities.DmTramQuanLy> DmTramQuanLy { get; set; }
        public DbSet<BuoyEntities.DmTinhThanhPho> DmTinhThanhPho { get; set; }
        public DbSet<BuoyEntities.Phao> Phao { get; set; }
        public DbSet<BuoyEntities.LichSuHoatDongPhao> LichSuHoatDongPhao { get; set; }
        public DbSet<BuoyEntities.LichSuBaoTri> LichSuBaoTri { get; set; }
        public DbSet<BuoyEntities.LichSuThayDoiThietBi> LichSuThayDoiThietBi { get; set; }

        // ============================================
        // WAREHOUSE MODULE - Quản lý kho
        // ============================================
        public DbSet<VaiTro> VaiTro { get; set; }
        public DbSet<TaiKhoan> TaiKhoan { get; set; }
        public DbSet<PhienLamViec> PhienLamViec { get; set; }
        public DbSet<Kho> Kho { get; set; }
        public DbSet<NhomVatLieu> NhomVatLieu { get; set; }
        public DbSet<DonViTinh> DonViTinh { get; set; }
        public DbSet<VatLieu> VatLieu { get; set; }
        public DbSet<TonKho> TonKho { get; set; }
        public DbSet<PhieuNhapXuat> PhieuNhapXuat { get; set; }
        public DbSet<ChiTietPhieuNhapXuat> ChiTietPhieuNhapXuat { get; set; }
        public DbSet<LichSuVatLieu> LichSuVatLieu { get; set; }

        // ============================================
        // ADMIN MODULE - Nhật ký hệ thống
        // ============================================
        public DbSet<NhatKyHeThong> NhatKyHeThong { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Cấu hình các quan hệ và ràng buộc

            // ── BUOY MODULE (Domain Entities) ──────────────────

            // Phao: MaLoaiPhao is computed column — mark as ValueGeneratedOnAddOrUpdate
            modelBuilder.Entity<BuoyEntities.Phao>()
                .Property(p => p.MaLoaiPhao)
                .ValueGeneratedOnAddOrUpdate();

            // DmViTriPhaoBH -> DmTuyenLuong
            modelBuilder.Entity<BuoyEntities.DmViTriPhaoBH>()
                .HasOne(v => v.TuyenLuong)
                .WithMany(t => t.ViTriPhaoList)
                .HasForeignKey(v => v.TuyenLuongId)
                .OnDelete(DeleteBehavior.Restrict);

            // Phao -> ViTriPhaoBHHienTai
            modelBuilder.Entity<BuoyEntities.Phao>()
                .HasOne(p => p.ViTriPhaoBHHienTai)
                .WithMany(v => v.PhaoHienTaiList)
                .HasForeignKey(p => p.ViTriPhaoBHHienTaiId)
                .OnDelete(DeleteBehavior.Restrict);

            // Phao -> TramQuanLy
            modelBuilder.Entity<BuoyEntities.Phao>()
                .HasOne(p => p.TramQuanLy)
                .WithMany()
                .HasForeignKey(p => p.TramQuanLyId)
                .OnDelete(DeleteBehavior.Restrict);

            // Phao -> TinhThanhPho
            modelBuilder.Entity<BuoyEntities.Phao>()
                .HasOne(p => p.TinhThanhPho)
                .WithMany()
                .HasForeignKey(p => p.TinhThanhPhoId)
                .OnDelete(DeleteBehavior.Restrict);

            // Phao -> DonViQuanLy
            modelBuilder.Entity<BuoyEntities.Phao>()
                .HasOne(p => p.DonViQuanLy)
                .WithMany()
                .HasForeignKey(p => p.DonViQuanLyId)
                .OnDelete(DeleteBehavior.Restrict);

            // Phao -> DonViVanHanh
            modelBuilder.Entity<BuoyEntities.Phao>()
                .HasOne(p => p.DonViVanHanh)
                .WithMany()
                .HasForeignKey(p => p.DonViVanHanhId)
                .OnDelete(DeleteBehavior.Restrict);

            // DmTramQuanLy -> DmDonVi
            modelBuilder.Entity<BuoyEntities.DmTramQuanLy>()
                .HasOne(t => t.DonViChuQuan)
                .WithMany()
                .HasForeignKey(t => t.DonViChuQuanId)
                .OnDelete(DeleteBehavior.Restrict);

            // LichSuHoatDongPhao -> Phao
            modelBuilder.Entity<BuoyEntities.LichSuHoatDongPhao>()
                .HasOne(ls => ls.Phao)
                .WithMany(p => p.LichSuHoatDongList)
                .HasForeignKey(ls => ls.PhaoId)
                .OnDelete(DeleteBehavior.Restrict);

            // LichSuHoatDongPhao -> ViTriPhaoBH
            modelBuilder.Entity<BuoyEntities.LichSuHoatDongPhao>()
                .HasOne(ls => ls.ViTriPhaoBH)
                .WithMany(v => v.LichSuHoatDongList)
                .HasForeignKey(ls => ls.ViTriPhaoBHId)
                .OnDelete(DeleteBehavior.Restrict);

            // LichSuBaoTri -> Phao
            modelBuilder.Entity<BuoyEntities.LichSuBaoTri>()
                .HasOne(bt => bt.Phao)
                .WithMany(p => p.LichSuBaoTriList)
                .HasForeignKey(bt => bt.PhaoId)
                .OnDelete(DeleteBehavior.Restrict);

            // LichSuThayDoiThietBi -> Phao
            modelBuilder.Entity<BuoyEntities.LichSuThayDoiThietBi>()
                .HasOne(tb => tb.Phao)
                .WithMany(p => p.LichSuThayDoiThietBiList)
                .HasForeignKey(tb => tb.PhaoId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── WAREHOUSE MODULE (Legacy Models) ──────────────────

            // TaiKhoan -> VaiTro
            modelBuilder.Entity<TaiKhoan>()
                .HasOne(t => t.VaiTro)
                .WithMany(v => v.TaiKhoanList)
                .HasForeignKey(t => t.VaiTroId)
                .OnDelete(DeleteBehavior.Restrict);

            // Kho -> KhoMe (self-reference)
            modelBuilder.Entity<Kho>()
                .HasOne(k => k.KhoMe)
                .WithMany(k => k.KhoConList)
                .HasForeignKey(k => k.KhoMeId)
                .OnDelete(DeleteBehavior.Restrict);

            // TonKho -> Kho
            modelBuilder.Entity<TonKho>()
                .HasOne(t => t.Kho)
                .WithMany(k => k.TonKhoList)
                .HasForeignKey(t => t.KhoId)
                .OnDelete(DeleteBehavior.Restrict);

            // TonKho -> VatLieu
            modelBuilder.Entity<TonKho>()
                .HasOne(t => t.VatLieu)
                .WithMany(v => v.TonKhoList)
                .HasForeignKey(t => t.VatLieuId)
                .OnDelete(DeleteBehavior.Restrict);

            // PhieuNhapXuat -> Kho (KhoNguon)
            modelBuilder.Entity<PhieuNhapXuat>()
                .HasOne(p => p.KhoNguon)
                .WithMany()
                .HasForeignKey(p => p.KhoNguonId)
                .OnDelete(DeleteBehavior.Restrict);

            // PhieuNhapXuat -> Kho (KhoNhap)
            modelBuilder.Entity<PhieuNhapXuat>()
                .HasOne(p => p.KhoNhap)
                .WithMany()
                .HasForeignKey(p => p.KhoNhapId)
                .OnDelete(DeleteBehavior.Restrict);

            // ChiTietPhieuNhapXuat -> VatLieu
            modelBuilder.Entity<ChiTietPhieuNhapXuat>()
                .HasOne(ct => ct.VatLieu)
                .WithMany()
                .HasForeignKey(ct => ct.VatLieuId)
                .OnDelete(DeleteBehavior.Restrict);

            // ChiTietPhieuNhapXuat -> PhieuNhapXuat
            modelBuilder.Entity<ChiTietPhieuNhapXuat>()
                .HasOne(ct => ct.PhieuNhapXuat)
                .WithMany(p => p.ChiTietList)
                .HasForeignKey(ct => ct.PhieuNhapXuatId)
                .OnDelete(DeleteBehavior.Cascade);

            // VatLieu -> NhomVatLieu
            modelBuilder.Entity<VatLieu>()
                .HasOne(v => v.NhomVatLieu)
                .WithMany(n => n.VatLieuList)
                .HasForeignKey(v => v.NhomVatLieuId)
                .OnDelete(DeleteBehavior.Restrict);

            // VatLieu -> DonViTinh
            modelBuilder.Entity<VatLieu>()
                .HasOne(v => v.DonViTinh)
                .WithMany(d => d.VatLieuList)
                .HasForeignKey(v => v.DonViTinhId)
                .OnDelete(DeleteBehavior.Restrict);

            // Kho -> NguoiPhuTrach (TaiKhoan)
            modelBuilder.Entity<Kho>()
                .HasOne(k => k.NguoiPhuTrachNavigation)
                .WithMany()
                .HasForeignKey(k => k.NguoiPhuTrach)
                .OnDelete(DeleteBehavior.Restrict);

            // LichSuVatLieu -> VatLieu
            modelBuilder.Entity<LichSuVatLieu>()
                .HasOne(l => l.VatLieu)
                .WithMany()
                .HasForeignKey(l => l.VatLieuId)
                .OnDelete(DeleteBehavior.Restrict);

            // LichSuVatLieu -> Kho
            modelBuilder.Entity<LichSuVatLieu>()
                .HasOne(l => l.Kho)
                .WithMany()
                .HasForeignKey(l => l.KhoId)
                .OnDelete(DeleteBehavior.Restrict);

            // LichSuVatLieu -> KhoLienQuan
            modelBuilder.Entity<LichSuVatLieu>()
                .HasOne(l => l.KhoLienQuan)
                .WithMany()
                .HasForeignKey(l => l.KhoLienQuanId)
                .OnDelete(DeleteBehavior.Restrict);

            // LichSuVatLieu -> TaiKhoan
            modelBuilder.Entity<LichSuVatLieu>()
                .HasOne(l => l.TaiKhoan)
                .WithMany()
                .HasForeignKey(l => l.TaiKhoanId)
                .OnDelete(DeleteBehavior.Restrict);

            // LichSuVatLieu -> PhienLamViec
            modelBuilder.Entity<LichSuVatLieu>()
                .HasOne(l => l.PhienLamViec)
                .WithMany()
                .HasForeignKey(l => l.PhienLamViecId)
                .OnDelete(DeleteBehavior.Restrict);

            // LichSuVatLieu -> PhieuNhapXuat
            modelBuilder.Entity<LichSuVatLieu>()
                .HasOne(l => l.PhieuNhapXuat)
                .WithMany()
                .HasForeignKey(l => l.PhieuNhapXuatId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── ADMIN MODULE ──────────────────────────────────

            // NhatKyHeThong -> TaiKhoan
            modelBuilder.Entity<NhatKyHeThong>()
                .HasOne(n => n.TaiKhoan)
                .WithMany()
                .HasForeignKey(n => n.TaiKhoanId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
