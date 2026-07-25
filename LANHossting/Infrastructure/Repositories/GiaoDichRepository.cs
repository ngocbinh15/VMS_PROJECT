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
                            KhoNhapId = (loaiPhieu == "NHAP") ? batch.KhoId : (loaiPhieu == "DIEUCHUYEN" ? items.FirstOrDefault()?.KhoNhanId : null),
                            LyDo = batch.GhiChu,
                            DonViCungCap = loaiPhieu == "NHAP" ? items.FirstOrDefault()?.NhaCungCap : null,
                            TrangThai = "CHO_DUYET",
                            GhiChu = batch.GhiChu,
                            NgayTao = DateTime.Now,
                            NgayCapNhat = DateTime.Now
                        };

                        _context.PhieuNhapXuat.Add(phieu);
                        await _context.SaveChangesAsync();

                        // ── Process each line item (Chỉ tạo ChiTietPhieuNhapXuat, CHƯA cập nhật TonKho) ───────────────────────
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
                        }

                        await _context.SaveChangesAsync();
                    }

                    await transaction.CommitAsync();

                    return new ServiceResult
                    {
                        Success = true,
                        Message = "Tạo phiếu giao dịch thành công. Phiếu đã được chuyển sang trạng thái Chờ duyệt bởi Quản trị viên."
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

        public async Task<List<PhieuChoDuyetDto>> GetDanhSachPhieuChoDuyetAsync()
        {
            var list = await _context.PhieuNhapXuat
                .Include(p => p.TaiKhoan)
                .Include(p => p.KhoNguon)
                .Include(p => p.KhoNhap)
                .Include(p => p.ChiTietList)
                    .ThenInclude(ct => ct.VatLieu)
                        .ThenInclude(v => v.DonViTinh)
                .Where(p => p.TrangThai == "CHO_DUYET" || p.TrangThai == "Chờ duyệt")
                .OrderByDescending(p => p.NgayTao)
                .ToListAsync();

            return list.Select(p => new PhieuChoDuyetDto
            {
                Id = p.Id,
                MaPhieu = p.MaPhieu,
                LoaiPhieu = p.LoaiPhieu,
                NgayTao = p.NgayTao,
                NguoiTao = p.TaiKhoan?.HoTen ?? p.TaiKhoan?.TenDangNhap ?? "N/A",
                TenKhoNguon = p.KhoNguon?.TenKho,
                TenKhoNhap = p.KhoNhap?.TenKho,
                DonViCungCap = p.DonViCungCap,
                LyDo = p.LyDo,
                TrangThai = p.TrangThai,
                ChiTietList = p.ChiTietList.Select(ct => new ChiTietPhieuChoDuyetDto
                {
                    VatLieuId = ct.VatLieuId,
                    MaVatLieu = ct.VatLieu?.MaVatLieu ?? string.Empty,
                    TenVatLieu = ct.VatLieu?.TenVatLieu ?? string.Empty,
                    DonViTinh = ct.VatLieu?.DonViTinh?.TenDonVi ?? string.Empty,
                    SoLuong = ct.SoLuong,
                    DonGia = ct.DonGia ?? 0,
                    SoLo = ct.SoLo,
                    NgaySanXuat = ct.NgaySanXuat,
                    NgayHetHan = ct.NgayHetHan,
                    GhiChu = ct.GhiChu
                }).ToList()
            }).ToList();
        }

        public async Task<ServiceResult> DuyetPhieuAsync(int phieuId, int nguoiDuyetId, int phienLamViecId)
        {
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    var phieu = await _context.PhieuNhapXuat
                        .Include(p => p.ChiTietList)
                        .FirstOrDefaultAsync(p => p.Id == phieuId);

                    if (phieu == null)
                        return new ServiceResult { Success = false, Message = "Không tìm thấy phiếu giao dịch." };

                    if (phieu.TrangThai != "CHO_DUYET" && phieu.TrangThai != "Chờ duyệt")
                        return new ServiceResult { Success = false, Message = $"Phiếu đang ở trạng thái '{phieu.TrangThai}', không thể duyệt." };

                    int mainKhoId = phieu.KhoNhapId ?? phieu.KhoNguonId ?? 0;

                    foreach (var ct in phieu.ChiTietList)
                    {
                        var vatLieu = await _context.VatLieu.FindAsync(ct.VatLieuId);
                        if (vatLieu == null)
                            throw new InvalidOperationException($"Vật tư ID={ct.VatLieuId} không tồn tại.");

                        decimal donGiaLine = ct.DonGia ?? vatLieu.DonGia;

                        var itemDto = new GiaoDichItemDto
                        {
                            VatLieuId = ct.VatLieuId,
                            LoaiPhieu = phieu.LoaiPhieu,
                            SoLuong = ct.SoLuong,
                            DonGia = donGiaLine,
                            SoLo = ct.SoLo,
                            GhiChu = ct.GhiChu
                        };

                        if (phieu.LoaiPhieu == "NHAP_KHO" || phieu.LoaiPhieu == "NHAP")
                        {
                            await ProcessNhapKho(itemDto, vatLieu, mainKhoId, phieu.Id, nguoiDuyetId, phienLamViecId, donGiaLine);
                        }
                        else if (phieu.LoaiPhieu == "XUAT_KHO" || phieu.LoaiPhieu == "XUAT")
                        {
                            await ProcessXuatKho(itemDto, vatLieu, mainKhoId, phieu.Id, nguoiDuyetId, phienLamViecId, donGiaLine);
                        }
                        else if (phieu.LoaiPhieu == "CHUYEN_KHO" || phieu.LoaiPhieu == "DIEUCHUYEN")
                        {
                            int khoNhanId = phieu.KhoNhapId ?? 0;
                            if (khoNhanId <= 0)
                                throw new InvalidOperationException("Phiếu chuyển kho thiếu thông tin kho nhận.");

                            await ProcessDieuChuyen(itemDto, vatLieu, phieu.KhoNguonId ?? 0, khoNhanId, phieu.Id, nguoiDuyetId, phienLamViecId, donGiaLine);
                        }
                    }

                    phieu.TrangThai = "Hoàn thành";
                    phieu.NgayThucHien = DateTime.Now;
                    phieu.NgayCapNhat = DateTime.Now;

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return new ServiceResult { Success = true, Message = $"Đã phê duyệt thành công phiếu {phieu.MaPhieu}." };
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    return new ServiceResult { Success = false, Message = ex.Message };
                }
            });
        }

        public async Task<ServiceResult> TuChoiPhieuAsync(int phieuId, int nguoiDuyetId, string? lyDo)
        {
            var phieu = await _context.PhieuNhapXuat.FindAsync(phieuId);
            if (phieu == null)
                return new ServiceResult { Success = false, Message = "Không tìm thấy phiếu giao dịch." };

            if (phieu.TrangThai != "CHO_DUYET" && phieu.TrangThai != "Chờ duyệt")
                return new ServiceResult { Success = false, Message = $"Phiếu đang ở trạng thái '{phieu.TrangThai}', không thể từ chối." };

            phieu.TrangThai = "Từ chối";
            if (!string.IsNullOrWhiteSpace(lyDo))
            {
                phieu.GhiChu = string.IsNullOrEmpty(phieu.GhiChu) ? $"Lý do từ chối: {lyDo}" : $"{phieu.GhiChu} | Lý do từ chối: {lyDo}";
            }
            phieu.NgayCapNhat = DateTime.Now;

            await _context.SaveChangesAsync();
            return new ServiceResult { Success = true, Message = $"Đã từ chối phiếu {phieu.MaPhieu}." };
        }

        public async Task<ServiceResult> RollbackPhieuAsync(int phieuId, int nguoiRollbackId, int phienLamViecId, string? lyDo)
        {
            var strategy = _context.Database.CreateExecutionStrategy();
            int validPhienId = phienLamViecId > 0 ? phienLamViecId : 1;

            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    var phieu = await _context.PhieuNhapXuat
                        .Include(p => p.ChiTietList).ThenInclude(ct => ct.VatLieu)
                        .FirstOrDefaultAsync(p => p.Id == phieuId);

                    if (phieu == null)
                        return new ServiceResult { Success = false, Message = "Không tìm thấy phiếu giao dịch." };

                    if (phieu.TrangThai != "Hoàn thành" && phieu.TrangThai != "HOAN_THANH")
                        return new ServiceResult { Success = false, Message = $"Chỉ được hoàn tác phiếu đã ở trạng thái 'Hoàn thành'. Trạng thái hiện tại: '{phieu.TrangThai}'." };

                    foreach (var ct in phieu.ChiTietList)
                    {
                        var vatLieu = ct.VatLieu ?? await _context.VatLieu.FindAsync(ct.VatLieuId);
                        var tenVl = vatLieu?.TenVatLieu ?? ct.VatLieuId.ToString();

                        if (phieu.LoaiPhieu == "NHAP_KHO" || phieu.LoaiPhieu == "NHAP")
                        {
                            int khoId = phieu.KhoNhapId ?? phieu.KhoNguonId ?? 0;
                            var tonKho = await _context.TonKho.FirstOrDefaultAsync(t => t.VatLieuId == ct.VatLieuId && t.KhoId == khoId);

                            if (tonKho == null || tonKho.SoLuongTon < ct.SoLuong)
                            {
                                var currentTon = tonKho?.SoLuongTon ?? 0;
                                var nextTicket = await _context.PhieuNhapXuat
                                    .Include(p => p.ChiTietList)
                                    .Where(p => p.Id > phieu.Id && p.TrangThai == "Hoàn thành")
                                    .Where(p => (p.KhoNguonId == khoId || p.KhoNhapId == khoId) && p.ChiTietList.Any(c => c.VatLieuId == ct.VatLieuId))
                                    .OrderByDescending(p => p.Id)
                                    .FirstOrDefaultAsync();

                                var hint = nextTicket != null
                                    ? $" do đã xuất hàng ở phiếu '{nextTicket.MaPhieu}'. Vui lòng hoàn tác phiếu '{nextTicket.MaPhieu}' trước!"
                                    : ". Vui lòng hoàn tác các phiếu xuất phát sinh sau đó trước!";

                                return new ServiceResult
                                {
                                    Success = false,
                                    Message = $"Không thể hoàn tác phiếu nhập {phieu.MaPhieu}: Tồn kho '{tenVl}' hiện chỉ còn {currentTon.ToString("G29")} (nhỏ hơn {ct.SoLuong.ToString("G29")} cần trừ)" + hint
                                };
                            }

                            decimal soLuongTruoc = tonKho.SoLuongTon;
                            tonKho.SoLuongTon -= ct.SoLuong;
                            tonKho.NgayCapNhat = DateTime.Now;
                            _context.TonKho.Update(tonKho);

                            _context.LichSuVatLieu.Add(new LichSuVatLieu
                            {
                                VatLieuId = ct.VatLieuId,
                                KhoId = khoId,
                                PhieuNhapXuatId = phieu.Id,
                                PhienLamViecId = validPhienId,
                                TaiKhoanId = nguoiRollbackId,
                                LoaiThayDoi = "HOAN_TAC_NHAP",
                                SoLuongTruoc = soLuongTruoc,
                                SoLuongThayDoi = -ct.SoLuong,
                                SoLuongSau = tonKho.SoLuongTon,
                                LyDo = $"Hoàn tác phiếu {phieu.MaPhieu}. {lyDo}".Trim(),
                                ThoiGian = DateTime.Now
                            });
                        }
                        else if (phieu.LoaiPhieu == "XUAT_KHO" || phieu.LoaiPhieu == "XUAT")
                        {
                            int khoId = phieu.KhoNguonId ?? phieu.KhoNhapId ?? 0;
                            var tonKho = await _context.TonKho.FirstOrDefaultAsync(t => t.VatLieuId == ct.VatLieuId && t.KhoId == khoId);

                            decimal soLuongTruoc = 0;
                            if (tonKho == null)
                            {
                                tonKho = new TonKho
                                {
                                    VatLieuId = ct.VatLieuId,
                                    KhoId = khoId,
                                    SoLuongTon = ct.SoLuong,
                                    SoLuongDatCho = 0,
                                    NgayCapNhat = DateTime.Now
                                };
                                _context.TonKho.Add(tonKho);
                            }
                            else
                            {
                                soLuongTruoc = tonKho.SoLuongTon;
                                tonKho.SoLuongTon += ct.SoLuong;
                                tonKho.NgayCapNhat = DateTime.Now;
                                _context.TonKho.Update(tonKho);
                            }

                            _context.LichSuVatLieu.Add(new LichSuVatLieu
                            {
                                VatLieuId = ct.VatLieuId,
                                KhoId = khoId,
                                PhieuNhapXuatId = phieu.Id,
                                PhienLamViecId = validPhienId,
                                TaiKhoanId = nguoiRollbackId,
                                LoaiThayDoi = "HOAN_TAC_XUAT",
                                SoLuongTruoc = soLuongTruoc,
                                SoLuongThayDoi = ct.SoLuong,
                                SoLuongSau = tonKho.SoLuongTon,
                                LyDo = $"Hoàn tác phiếu {phieu.MaPhieu}. {lyDo}".Trim(),
                                ThoiGian = DateTime.Now
                            });
                        }
                        else if (phieu.LoaiPhieu == "CHUYEN_KHO" || phieu.LoaiPhieu == "CHUYEN")
                        {
                            int khoNguonId = phieu.KhoNguonId ?? 0;
                            int khoNhapId = phieu.KhoNhapId ?? 0;

                            var tonKhoNhap = await _context.TonKho.FirstOrDefaultAsync(t => t.VatLieuId == ct.VatLieuId && t.KhoId == khoNhapId);
                            if (tonKhoNhap == null || tonKhoNhap.SoLuongTon < ct.SoLuong)
                            {
                                var currentTon = tonKhoNhap?.SoLuongTon ?? 0;
                                var nextTicket = await _context.PhieuNhapXuat
                                    .Include(p => p.ChiTietList)
                                    .Where(p => p.Id > phieu.Id && p.TrangThai == "Hoàn thành")
                                    .Where(p => (p.KhoNguonId == khoNhapId || p.KhoNhapId == khoNhapId) && p.ChiTietList.Any(c => c.VatLieuId == ct.VatLieuId))
                                    .OrderByDescending(p => p.Id)
                                    .FirstOrDefaultAsync();

                                var hint = nextTicket != null
                                    ? $" do đã xuất hàng ở phiếu '{nextTicket.MaPhieu}'. Vui lòng hoàn tác phiếu '{nextTicket.MaPhieu}' trước!"
                                    : ". Vui lòng hoàn tác các phiếu xuất phát sinh sau đó trước!";

                                return new ServiceResult
                                {
                                    Success = false,
                                    Message = $"Không thể hoàn tác chuyển kho {phieu.MaPhieu}: Tồn kho '{tenVl}' tại kho nhận hiện chỉ còn {currentTon.ToString("G29")} (nhỏ hơn {ct.SoLuong.ToString("G29")} cần trừ)" + hint
                                };
                            }

                            decimal truocNhap = tonKhoNhap.SoLuongTon;
                            tonKhoNhap.SoLuongTon -= ct.SoLuong;
                            tonKhoNhap.NgayCapNhat = DateTime.Now;
                            _context.TonKho.Update(tonKhoNhap);

                            var tonKhoNguon = await _context.TonKho.FirstOrDefaultAsync(t => t.VatLieuId == ct.VatLieuId && t.KhoId == khoNguonId);
                            decimal truocNguon = 0;
                            if (tonKhoNguon == null)
                            {
                                tonKhoNguon = new TonKho
                                {
                                    VatLieuId = ct.VatLieuId,
                                    KhoId = khoNguonId,
                                    SoLuongTon = ct.SoLuong,
                                    SoLuongDatCho = 0,
                                    NgayCapNhat = DateTime.Now
                                };
                                _context.TonKho.Add(tonKhoNguon);
                            }
                            else
                            {
                                truocNguon = tonKhoNguon.SoLuongTon;
                                tonKhoNguon.SoLuongTon += ct.SoLuong;
                                tonKhoNguon.NgayCapNhat = DateTime.Now;
                                _context.TonKho.Update(tonKhoNguon);
                            }

                            _context.LichSuVatLieu.Add(new LichSuVatLieu
                            {
                                VatLieuId = ct.VatLieuId,
                                KhoId = khoNguonId,
                                PhieuNhapXuatId = phieu.Id,
                                PhienLamViecId = validPhienId,
                                TaiKhoanId = nguoiRollbackId,
                                LoaiThayDoi = "HOAN_TAC_CHUYEN",
                                SoLuongTruoc = truocNguon,
                                SoLuongThayDoi = ct.SoLuong,
                                SoLuongSau = tonKhoNguon.SoLuongTon,
                                KhoLienQuanId = khoNhapId,
                                LyDo = $"Hoàn tác chuyển kho phiếu {phieu.MaPhieu}. {lyDo}".Trim(),
                                ThoiGian = DateTime.Now
                            });
                        }
                    }

                    phieu.TrangThai = "Đã hoàn tác";
                    phieu.LyDo = !string.IsNullOrWhiteSpace(lyDo) ? lyDo.Trim() : phieu.LyDo;
                    if (!string.IsNullOrWhiteSpace(lyDo))
                    {
                        phieu.GhiChu = string.IsNullOrEmpty(phieu.GhiChu) ? $"Lý do hoàn tác: {lyDo}" : $"{phieu.GhiChu} | Lý do hoàn tác: {lyDo}";
                    }
                    phieu.NgayCapNhat = DateTime.Now;

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return new ServiceResult { Success = true, Message = $"Đã hoàn tác phiếu {phieu.MaPhieu} thành công và đảo ngược tồn kho!" };
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    var errMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                    return new ServiceResult { Success = false, Message = "Lỗi hoàn tác phiếu: " + errMsg };
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
