using LANHossting.Application.DTOs;
using LANHossting.Application.Interfaces;
using LANHossting.Data;
using LANHossting.Models;
using Microsoft.EntityFrameworkCore;

namespace LANHossting.Infrastructure.Repositories
{
    /// <summary>
    /// Repository for transactional inventory operations (nhập/xuất/điều chuyển).
    /// 
    /// RULES:
    ///   - All mutations wrapped in EF Core transaction.
    ///   - TonKho is scoped to (VatLieuId, KhoId) — UNIQUE constraint.
    ///   - NHAP: upsert TonKho for target kho only. Optionally update VatLieu.DonGia.
    ///   - XUAT: must check SoLuongKhaDung >= soLuong for exact khoId.
    ///   - DIEUCHUYEN: subtract source, add target (upsert if target record missing).
    ///   - LichSuVatLieu audit log for every line.
    ///   - NEVER modify TenVatLieu during transaction.
    /// </summary>
    public class GiaoDichRepository : IGiaoDichRepository
    {
        private readonly AppDbContext _context;

        public GiaoDichRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult> ExecuteBatchAsync(
            GiaoDichBatchDto batch, int taiKhoanId, int phienLamViecId)
        {
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Group line items by LoaiPhieu to create separate PhieuNhapXuat per type
                    var groups = batch.Items.GroupBy(i => i.LoaiPhieu.ToUpper()).ToList();

                    foreach (var group in groups)
                    {
                        var loaiPhieu = group.Key;
                        var items = group.ToList();

                        // ── Generate MaPhieu ─────────────────────────────
                        var prefix = loaiPhieu switch
                        {
                            "NHAP" => "PN",
                            "XUAT" => "PX",
                            "DIEUCHUYEN" => "PC",
                            _ => "PK"
                        };
                        var loaiPhieuDb = loaiPhieu switch
                        {
                            "NHAP" => "NHAP_KHO",
                            "XUAT" => "XUAT_KHO",
                            "DIEUCHUYEN" => "CHUYEN_KHO",
                            _ => loaiPhieu
                        };

                        var year = DateTime.Now.Year;
                        var maxSeq = await _context.PhieuNhapXuat
                            .Where(p => p.NgayPhieu.Year == year && p.LoaiPhieu == loaiPhieuDb)
                            .OrderByDescending(p => p.MaPhieu)
                            .Select(p => p.MaPhieu)
                            .FirstOrDefaultAsync();

                        int nextSeq = 1;
                        if (maxSeq != null && maxSeq.Length > 6)
                        {
                            var seqPart = maxSeq.Substring(maxSeq.Length - 6);
                            if (int.TryParse(seqPart, out var parsed)) nextSeq = parsed + 1;
                        }

                        var maPhieu = $"{prefix}{year}{nextSeq:D6}";

                        // ── Create PhieuNhapXuat ─────────────────────────
                        var phieu = new PhieuNhapXuat
                        {
                            MaPhieu = maPhieu,
                            LoaiPhieu = loaiPhieuDb,
                            PhienLamViecId = phienLamViecId,
                            TaiKhoanId = taiKhoanId,
                            NgayPhieu = DateTime.Now,
                            NgayThucHien = DateTime.Now,
                            KhoNguonId = (loaiPhieu == "XUAT" || loaiPhieu == "DIEUCHUYEN") ? batch.KhoId : null,
                            KhoNhapId = loaiPhieu == "NHAP" ? batch.KhoId : null,
                            LyDo = batch.GhiChu,
                            DonViCungCap = loaiPhieu == "NHAP" ? items.FirstOrDefault()?.NhaCungCap : null,
                            TrangThai = "Hoàn thành",
                            GhiChu = batch.GhiChu,
                            NgayTao = DateTime.Now,
                            NgayCapNhat = DateTime.Now
                        };

                        _context.PhieuNhapXuat.Add(phieu);
                        await _context.SaveChangesAsync();

                        // ── Process each line item ───────────────────────
                        foreach (var item in items)
                        {
                            // Validate VatLieu exists
                            var vatLieu = await _context.VatLieu.FindAsync(item.VatLieuId);
                            if (vatLieu == null)
                                throw new InvalidOperationException($"Vật tư ID={item.VatLieuId} không tồn tại.");

                            // Resolve DonGia: user-provided or current VatLieu.DonGia
                            var donGiaForChiTiet = (item.DonGia.HasValue && item.DonGia.Value > 0)
                                ? item.DonGia.Value
                                : vatLieu.DonGia;

                            // Create ChiTietPhieuNhapXuat
                            var chiTiet = new ChiTietPhieuNhapXuat
                            {
                                PhieuNhapXuatId = phieu.Id,
                                VatLieuId = item.VatLieuId,
                                SoLuong = item.SoLuong,
                                DonGia = donGiaForChiTiet,
                                SoLo = item.SoLo,
                                NgaySanXuat = ParseDate(item.NgaySanXuat),
                                NgayHetHan = ParseDate(item.NgayHetHan),
                                GhiChu = item.GhiChu
                            };
                            _context.ChiTietPhieuNhapXuat.Add(chiTiet);

                            switch (loaiPhieu)
                            {
                                case "NHAP":
                                    await ProcessNhapKho(
                                        item, vatLieu, batch.KhoId, phieu.Id,
                                        taiKhoanId, phienLamViecId, donGiaForChiTiet);
                                    break;

                                case "XUAT":
                                    await ProcessXuatKho(
                                        item, vatLieu, batch.KhoId, phieu.Id,
                                        taiKhoanId, phienLamViecId, donGiaForChiTiet);
                                    break;

                                case "DIEUCHUYEN":
                                    if (!item.KhoNhanId.HasValue || item.KhoNhanId.Value <= 0)
                                        throw new InvalidOperationException("Kho đích là bắt buộc cho điều chuyển.");
                                    if (item.KhoNhanId.Value == batch.KhoId)
                                        throw new InvalidOperationException("Kho đích không được trùng kho nguồn.");
                                    await ProcessDieuChuyen(
                                        item, vatLieu, batch.KhoId, item.KhoNhanId.Value,
                                        phieu.Id, taiKhoanId, phienLamViecId, donGiaForChiTiet);
                                    break;

                                default:
                                    throw new InvalidOperationException($"Loại giao dịch không hợp lệ: {loaiPhieu}");
                            }
                        }

                        await _context.SaveChangesAsync();
                    }

                    await transaction.CommitAsync();

                    return new ServiceResult
                    {
                        Success = true,
                        Message = "Giao dịch hoàn tất thành công."
                    };
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    return new ServiceResult
                    {
                        Success = false,
                        Message = ex.Message,
                        Errors = new List<string> { ex.InnerException?.Message ?? ex.Message }
                    };
                }
            });
        }

        // ═══════════════════════════════════════════════════════
        // NHẬP KHO
        // ═══════════════════════════════════════════════════════
        private async Task ProcessNhapKho(
            GiaoDichItemDto item, VatLieu vatLieu, int khoId, int phieuId,
            int taiKhoanId, int phienLamViecId, decimal donGia)
        {
            // Update VatLieu.DonGia if user provided a new price
            if (item.DonGia.HasValue && item.DonGia.Value > 0 && item.DonGia.Value != vatLieu.DonGia)
            {
                vatLieu.DonGia = item.DonGia.Value;
                _context.VatLieu.Update(vatLieu);
            }

            // Upsert TonKho for this specific warehouse ONLY
            var tonKho = await _context.TonKho
                .FirstOrDefaultAsync(t => t.VatLieuId == item.VatLieuId && t.KhoId == khoId);

            decimal soLuongTruoc = 0;

            if (tonKho == null)
            {
                // First time this material enters this warehouse → create record
                tonKho = new TonKho
                {
                    VatLieuId = item.VatLieuId,
                    KhoId = khoId,
                    SoLuongTon = item.SoLuong,
                    SoLuongDatCho = 0,
                    NgayCapNhat = DateTime.Now
                };
                _context.TonKho.Add(tonKho);
            }
            else
            {
                soLuongTruoc = tonKho.SoLuongTon;
                tonKho.SoLuongTon += item.SoLuong;
                tonKho.NgayCapNhat = DateTime.Now;
                _context.TonKho.Update(tonKho);
            }

            // Audit log
            _context.LichSuVatLieu.Add(new LichSuVatLieu
            {
                VatLieuId = item.VatLieuId,
                KhoId = khoId,
                PhieuNhapXuatId = phieuId,
                PhienLamViecId = phienLamViecId,
                TaiKhoanId = taiKhoanId,
                LoaiThayDoi = "NHAP",
                SoLuongTruoc = soLuongTruoc,
                SoLuongThayDoi = item.SoLuong,
                SoLuongSau = soLuongTruoc + item.SoLuong,
                LyDo = item.GhiChu,
                ThoiGian = DateTime.Now
            });
        }

        // ═══════════════════════════════════════════════════════
        // XUẤT KHO
        // ═══════════════════════════════════════════════════════
        private async Task ProcessXuatKho(
            GiaoDichItemDto item, VatLieu vatLieu, int khoId, int phieuId,
            int taiKhoanId, int phienLamViecId, decimal donGia)
        {
            var tonKho = await _context.TonKho
                .FirstOrDefaultAsync(t => t.VatLieuId == item.VatLieuId && t.KhoId == khoId);

            if (tonKho == null)
                throw new InvalidOperationException(
                    $"Vật tư '{vatLieu.TenVatLieu}' không có tồn kho tại kho này.");

            var soLuongKhaDung = tonKho.SoLuongTon - (tonKho.SoLuongDatCho ?? 0);
            if (soLuongKhaDung < item.SoLuong)
                throw new InvalidOperationException(
                    $"Vật tư '{vatLieu.TenVatLieu}': tồn khả dụng ({soLuongKhaDung}) < số lượng xuất ({item.SoLuong}).");

            var soLuongTruoc = tonKho.SoLuongTon;
            tonKho.SoLuongTon -= item.SoLuong;
            tonKho.NgayCapNhat = DateTime.Now;
            _context.TonKho.Update(tonKho);

            // Audit log
            _context.LichSuVatLieu.Add(new LichSuVatLieu
            {
                VatLieuId = item.VatLieuId,
                KhoId = khoId,
                PhieuNhapXuatId = phieuId,
                PhienLamViecId = phienLamViecId,
                TaiKhoanId = taiKhoanId,
                LoaiThayDoi = "XUAT",
                SoLuongTruoc = soLuongTruoc,
                SoLuongThayDoi = -item.SoLuong,
                SoLuongSau = soLuongTruoc - item.SoLuong,
                LyDo = item.GhiChu,
                ThoiGian = DateTime.Now
            });
        }

        // ═══════════════════════════════════════════════════════
        // ĐIỀU CHUYỂN
        // ═══════════════════════════════════════════════════════
        private async Task ProcessDieuChuyen(
            GiaoDichItemDto item, VatLieu vatLieu, int khoNguonId, int khoDichId,
            int phieuId, int taiKhoanId, int phienLamViecId, decimal donGia)
        {
            // ── Source warehouse: subtract ────────────────────
            var tonKhoNguon = await _context.TonKho
                .FirstOrDefaultAsync(t => t.VatLieuId == item.VatLieuId && t.KhoId == khoNguonId);

            if (tonKhoNguon == null)
                throw new InvalidOperationException(
                    $"Vật tư '{vatLieu.TenVatLieu}' không có tồn kho tại kho nguồn.");

            var khaDungNguon = tonKhoNguon.SoLuongTon - (tonKhoNguon.SoLuongDatCho ?? 0);
            if (khaDungNguon < item.SoLuong)
                throw new InvalidOperationException(
                    $"Vật tư '{vatLieu.TenVatLieu}': tồn khả dụng kho nguồn ({khaDungNguon}) < số lượng điều chuyển ({item.SoLuong}).");

            var soLuongTruocNguon = tonKhoNguon.SoLuongTon;
            tonKhoNguon.SoLuongTon -= item.SoLuong;
            tonKhoNguon.NgayCapNhat = DateTime.Now;
            _context.TonKho.Update(tonKhoNguon);

            // Audit log — source (CHUYEN_DI)
            _context.LichSuVatLieu.Add(new LichSuVatLieu
            {
                VatLieuId = item.VatLieuId,
                KhoId = khoNguonId,
                PhieuNhapXuatId = phieuId,
                PhienLamViecId = phienLamViecId,
                TaiKhoanId = taiKhoanId,
                LoaiThayDoi = "CHUYEN_DI",
                SoLuongTruoc = soLuongTruocNguon,
                SoLuongThayDoi = -item.SoLuong,
                SoLuongSau = soLuongTruocNguon - item.SoLuong,
                KhoLienQuanId = khoDichId,
                LyDo = item.GhiChu,
                ThoiGian = DateTime.Now
            });

            // ── Target warehouse: upsert ─────────────────────
            var tonKhoDich = await _context.TonKho
                .FirstOrDefaultAsync(t => t.VatLieuId == item.VatLieuId && t.KhoId == khoDichId);

            decimal soLuongTruocDich = 0;

            if (tonKhoDich == null)
            {
                tonKhoDich = new TonKho
                {
                    VatLieuId = item.VatLieuId,
                    KhoId = khoDichId,
                    SoLuongTon = item.SoLuong,
                    SoLuongDatCho = 0,
                    NgayCapNhat = DateTime.Now
                };
                _context.TonKho.Add(tonKhoDich);
            }
            else
            {
                soLuongTruocDich = tonKhoDich.SoLuongTon;
                tonKhoDich.SoLuongTon += item.SoLuong;
                tonKhoDich.NgayCapNhat = DateTime.Now;
                _context.TonKho.Update(tonKhoDich);
            }

            // Audit log — target (CHUYEN_DEN)
            _context.LichSuVatLieu.Add(new LichSuVatLieu
            {
                VatLieuId = item.VatLieuId,
                KhoId = khoDichId,
                PhieuNhapXuatId = phieuId,
                PhienLamViecId = phienLamViecId,
                TaiKhoanId = taiKhoanId,
                LoaiThayDoi = "CHUYEN_DEN",
                SoLuongTruoc = soLuongTruocDich,
                SoLuongThayDoi = item.SoLuong,
                SoLuongSau = soLuongTruocDich + item.SoLuong,
                KhoLienQuanId = khoNguonId,
                LyDo = item.GhiChu,
                ThoiGian = DateTime.Now
            });
        }

        private static DateTime? ParseDate(string? dateStr)
        {
            if (string.IsNullOrWhiteSpace(dateStr)) return null;
            return DateTime.TryParse(dateStr, out var d) ? d : null;
        }
    }
}
