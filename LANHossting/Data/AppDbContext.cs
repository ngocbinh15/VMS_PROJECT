using Microsoft.EntityFrameworkCore;
using LANHossting.Models;

namespace LANHossting.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // ============================================
        // BUOY MODULE - Quản lý phao
        // ============================================
        public DbSet<DmTuyenLuong> DmTuyenLuong { get; set; }
        public DbSet<DmViTriPhaoBH> DmViTriPhaoBH { get; set; }
        public DbSet<Phao> Phao { get; set; }

        // ============================================
        // WAREHOUSE MODULE - Quản lý kho
        // ============================================
        public DbSet<VaiTro> VaiTro { get; set; }
        public DbSet<TaiKhoan> TaiKhoan { get; set; }
        public DbSet<PhienLamViec> PhienLamViec { get; set; }
        public DbSet<Kho> Kho { get; set; }
        public DbSet<VatLieu> VatLieu { get; set; }
        public DbSet<TonKho> TonKho { get; set; }
        public DbSet<PhieuNhapXuat> PhieuNhapXuat { get; set; }
        public DbSet<LichSuVatLieu> LichSuVatLieu { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Cấu hình các quan hệ và ràng buộc
            
            // DmViTriPhaoBH -> DmTuyenLuong
            modelBuilder.Entity<DmViTriPhaoBH>()
                .HasOne(v => v.TuyenLuong)
                .WithMany(t => t.ViTriPhaoList)
                .HasForeignKey(v => v.TuyenLuongId)
                .OnDelete(DeleteBehavior.Restrict);

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

            // PhieuNhapXuat -> Kho (KhoNhan)
            modelBuilder.Entity<PhieuNhapXuat>()
                .HasOne(p => p.KhoNhan)
                .WithMany()
                .HasForeignKey(p => p.KhoNhanId)
                .OnDelete(DeleteBehavior.Restrict);

            // PhieuNhapXuat -> VatLieu
            modelBuilder.Entity<PhieuNhapXuat>()
                .HasOne(p => p.VatLieu)
                .WithMany(v => v.PhieuNhapXuatList)
                .HasForeignKey(p => p.VatLieuId)
                .OnDelete(DeleteBehavior.Restrict);

            // PhieuNhapXuat -> TaiKhoan (NguoiLap)
            modelBuilder.Entity<PhieuNhapXuat>()
                .HasOne(p => p.NguoiLap)
                .WithMany()
                .HasForeignKey(p => p.NguoiLapId)
                .OnDelete(DeleteBehavior.Restrict);

            // PhieuNhapXuat -> TaiKhoan (NguoiDuyet)
            modelBuilder.Entity<PhieuNhapXuat>()
                .HasOne(p => p.NguoiDuyet)
                .WithMany()
                .HasForeignKey(p => p.NguoiDuyetId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
