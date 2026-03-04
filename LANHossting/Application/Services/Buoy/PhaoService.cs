using LANHossting.Application.DTOs.Buoy;
using LANHossting.Application.Interfaces.Buoy;
using LANHossting.Domain.Entities.Buoy;
using LANHossting.Domain.Enums;

namespace LANHossting.Application.Services.Buoy
{
    /// <summary>
    /// Service xử lý business logic cho module Phao.
    /// Map entity → DTO, tổng hợp thống kê.
    /// </summary>
    public class PhaoService : IPhaoService
    {
        private readonly IPhaoRepository _phaoRepo;
        private readonly ITuyenLuongRepository _tuyenLuongRepo;

        public PhaoService(IPhaoRepository phaoRepo, ITuyenLuongRepository tuyenLuongRepo)
        {
            _phaoRepo = phaoRepo;
            _tuyenLuongRepo = tuyenLuongRepo;
        }

        public async Task<PhaoThongKeDto> GetThongKeAsync()
        {
            var tongSo = await _phaoRepo.CountAllAsync();
            var trenLuong = await _phaoRepo.CountTrenLuongAsync();
            var duPhong = await _phaoRepo.CountDuPhongAsync();
            var suCo = await _phaoRepo.CountSuCoAsync();

            return new PhaoThongKeDto
            {
                TongSoPhao = tongSo,
                SoPhaoTrenLuong = trenLuong,
                SoPhaoDuPhong = duPhong,
                SoPhaoSuCo = suCo,
                SoPhaoBaoTri = Math.Max(0, tongSo - trenLuong - duPhong - suCo)
            };
        }

        public async Task<List<PhaoListItemDto>> GetDanhSachPhaoAsync(string? searchTerm = null, int? tuyenLuongId = null)
        {
            var phaoList = await _phaoRepo.GetAllWithCurrentStatusAsync();

            // Filter theo tuyến luồng
            if (tuyenLuongId.HasValue)
            {
                phaoList = phaoList
                    .Where(p => p.ViTriPhaoBHHienTai?.TuyenLuongId == tuyenLuongId.Value)
                    .ToList();
            }

            // Filter theo search term
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.Trim().ToLower();
                phaoList = phaoList
                    .Where(p =>
                        (p.KyHieuTaiSan?.ToLower().Contains(term) ?? false) ||
                        p.MaPhaoDayDu.ToLower().Contains(term) ||
                        (p.TenPhao?.ToLower().Contains(term) ?? false) ||
                        (p.MaLoaiPhao?.ToLower().Contains(term) ?? false) ||
                        (p.TrangThaiHienTai?.ToLower().Contains(term) ?? false))
                    .ToList();
            }

            var result = new List<PhaoListItemDto>();

            foreach (var p in phaoList)
            {
                var viTri = p.ViTriPhaoBHHienTai;

                result.Add(new PhaoListItemDto
                {
                    Id = p.Id,
                    KyHieuTaiSan = p.KyHieuTaiSan ?? "--",
                    MaPhaoDayDu = p.MaPhaoDayDu,
                    MaLoaiPhao = p.MaLoaiPhao,
                    TenPhao = p.TenPhao,
                    SoPhaoHienTai = p.SoPhaoHienTai,
                    DuongKinhPhao = p.DuongKinhPhao,
                    TrangThaiHienTai = MapTrangThaiHienThi(p.TrangThaiHienTai),
                    ViTriHienTai = viTri?.MaPhaoBH,
                    TuyenLuong = viTri?.TuyenLuong?.TenTuyen,
                    ToaDo = viTri?.ToaDoThietKe,
                    NgaySuDung = p.NgayTao,
                    NgaySuaChuaGanNhat = p.ThoiDiemSuaChuaGanNhat, // Read directly from Phao entity
                    TrangThaiHienThiClass = MapTrangThaiCssClass(p.TrangThaiHienTai)
                });
            }

            return result.OrderBy(p => p.SoPhaoHienTai ?? 999).ToList();
        }

        public async Task<PhaoChiTietDto?> GetChiTietPhaoAsync(int id)
        {
            var p = await _phaoRepo.GetByIdAsync(id);
            if (p == null) return null;

            var viTri = p.ViTriPhaoBHHienTai;

            return new PhaoChiTietDto
            {
                Id = p.Id,
                KyHieuTaiSan = p.KyHieuTaiSan,
                MaPhaoDayDu = p.MaPhaoDayDu,
                MaLoaiPhao = p.MaLoaiPhao,
                TenPhao = p.TenPhao,
                SoPhaoHienTai = p.SoPhaoHienTai,
                DuongKinhPhao = p.DuongKinhPhao,
                ChieuCaoToanBo = p.ChieuCaoToanBo,
                HinhDang = p.HinhDang,
                VatLieu = p.VatLieu,
                MauSac = p.MauSac,

                // Thời gian v1.1
                ThoiGianSuDung = p.ThoiGianSuDung,
                ThoiDiemThayTha = p.ThoiDiemThayTha,
                ThoiDiemSuaChuaGanNhat = p.ThoiDiemSuaChuaGanNhat,

                // Xích phao
                XichPhao_DuongKinh = p.XichPhao_DuongKinh,
                XichPhao_ChieuDai = p.XichPhao_ChieuDai,
                XichPhao_ThoiDiemSuDung = p.XichPhao_ThoiDiemSuDung,

                // Xích rùa
                XichRua_DuongKinh = p.XichRua_DuongKinh,
                XichRua_ChieuDai = p.XichRua_ChieuDai,
                XichRua_ThoiDiemSuDung = p.XichRua_ThoiDiemSuDung,

                // Rùa
                Rua_TrongLuong = p.Rua_TrongLuong,
                Rua_ThoiDiemSuDung = p.Rua_ThoiDiemSuDung,

                // Hành chính v1.1
                TramQuanLyId = p.TramQuanLyId,
                TramQuanLyTen = p.TramQuanLy?.TenTram,
                TinhThanhPhoId = p.TinhThanhPhoId,
                TinhThanhPhoTen = p.TinhThanhPho?.TenTinh,
                DonViQuanLyId = p.DonViQuanLyId,
                DonViQuanLyTen = p.DonViQuanLy?.TenDonVi,
                DonViVanHanhId = p.DonViVanHanhId,
                DonViVanHanhTen = p.DonViVanHanh?.TenDonVi,

                // Vị trí
                ViTriPhaoBHHienTaiId = p.ViTriPhaoBHHienTaiId,
                ViTriHienTai = viTri?.MaPhaoBH,
                TuyenLuongId = viTri?.TuyenLuongId,
                TuyenLuong = viTri?.TuyenLuong?.TenTuyen,
                ToaDoThietKe = viTri?.ToaDoThietKe,

                // Quyết định v1.1
                SoQuyetDinhTang = p.SoQuyetDinhTang,
                NgayQuyetDinhTang = p.NgayQuyetDinhTang,
                DienTich = p.DienTich,

                // Đèn
                Den_ChungLoai = p.Den_ChungLoai,
                Den_KetNoiAIS = p.Den_KetNoiAIS,
                Den_DacTinhAnhSang = p.Den_DacTinhAnhSang,
                Den_ChieuXaTamSang = p.Den_ChieuXaTamSang,
                Den_ChieuCaoTamSangHaiDo = p.Den_ChieuCaoTamSangHaiDo,
                Den_NguonCapNangLuong = p.Den_NguonCapNangLuong,
                Den_ThoiDiemSuDung = p.Den_ThoiDiemSuDung,
                Den_ThoiDiemSuaChua = p.Den_ThoiDiemSuaChua,
                Den_SoQuyetDinhTang = p.Den_SoQuyetDinhTang,

                TrangThaiHienTai = p.TrangThaiHienTai,
                TrangThaiHoatDong = MapToTrangThaiHoatDong(p.TrangThaiHienTai),
            };
        }

        public async Task<List<TuyenLuongDto>> GetDanhSachTuyenLuongAsync()
        {
            var tuyenList = await _tuyenLuongRepo.GetAllActiveAsync();

            return tuyenList.Select(t => new TuyenLuongDto
            {
                Id = t.Id,
                MaTuyen = t.MaTuyen,
                TenTuyen = t.TenTuyen,
                SoViTri = t.ViTriPhaoList.Count
            }).ToList();
        }

        public async Task<(bool Success, string? Error)> CapNhatPhaoAsync(PhaoEditDto dto)
        {
            try
            {
                var phao = await _phaoRepo.GetByIdForEditAsync(dto.Id);
                if (phao == null)
                    return (false, "Không tìm thấy phao với Id = " + dto.Id);

                // ── Chỉ cập nhật thông tin kỹ thuật, KHÔNG thay đổi trạng thái vận hành ──
                // Trạng thái hoạt động + Tuyến luồng + Vị trí chỉ được thay đổi qua Điều Phối

                // Map DTO → Entity (thong tin ky thuat)
                phao.KyHieuTaiSan = dto.KyHieuTaiSan;
                phao.MaPhaoDayDu = dto.MaPhaoDayDu;
                phao.TenPhao = dto.TenPhao;
                phao.SoPhaoHienTai = dto.SoPhaoHienTai;
                phao.DuongKinhPhao = dto.DuongKinhPhao;
                phao.ChieuCaoToanBo = dto.ChieuCaoToanBo;
                phao.HinhDang = dto.HinhDang;
                phao.VatLieu = dto.VatLieu;
                phao.MauSac = dto.MauSac;

                // Thời gian v1.1
                phao.ThoiGianSuDung = dto.ThoiGianSuDung;
                phao.ThoiDiemThayTha = dto.ThoiDiemThayTha;
                phao.ThoiDiemSuaChuaGanNhat = dto.ThoiDiemSuaChuaGanNhat;

                // Xích phao
                phao.XichPhao_DuongKinh = dto.XichPhao_DuongKinh;
                phao.XichPhao_ChieuDai = dto.XichPhao_ChieuDai;
                phao.XichPhao_ThoiDiemSuDung = dto.XichPhao_ThoiDiemSuDung;

                // Xích rùa
                phao.XichRua_DuongKinh = dto.XichRua_DuongKinh;
                phao.XichRua_ChieuDai = dto.XichRua_ChieuDai;
                phao.XichRua_ThoiDiemSuDung = dto.XichRua_ThoiDiemSuDung;

                // Rùa
                phao.Rua_TrongLuong = dto.Rua_TrongLuong;
                phao.Rua_ThoiDiemSuDung = dto.Rua_ThoiDiemSuDung;

                // Hành chính v1.1
                phao.TramQuanLyId = dto.TramQuanLyId;
                phao.TinhThanhPhoId = dto.TinhThanhPhoId;
                phao.DonViQuanLyId = dto.DonViQuanLyId;
                phao.DonViVanHanhId = dto.DonViVanHanhId;

                // Quyết định v1.1
                phao.SoQuyetDinhTang = dto.SoQuyetDinhTang;
                phao.NgayQuyetDinhTang = dto.NgayQuyetDinhTang;
                phao.DienTich = dto.DienTich;

                // Đèn
                phao.Den_ChungLoai = dto.Den_ChungLoai;
                phao.Den_KetNoiAIS = dto.Den_KetNoiAIS;
                phao.Den_DacTinhAnhSang = dto.Den_DacTinhAnhSang;
                phao.Den_ChieuXaTamSang = dto.Den_ChieuXaTamSang;
                phao.Den_ChieuCaoTamSangHaiDo = dto.Den_ChieuCaoTamSangHaiDo;
                phao.Den_NguonCapNangLuong = dto.Den_NguonCapNangLuong;
                phao.Den_ThoiDiemSuDung = dto.Den_ThoiDiemSuDung;
                phao.Den_ThoiDiemSuaChua = dto.Den_ThoiDiemSuaChua;
                phao.Den_SoQuyetDinhTang = dto.Den_SoQuyetDinhTang;

                // Audit
                phao.NgayCapNhat = DateTime.Now;
                phao.NguoiCapNhat = dto.NguoiCapNhat;

                await _phaoRepo.SaveChangesAsync();
                return (true, null);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi cập nhật: " + ex.Message);
            }
        }

        public async Task<(bool Success, string? Error)> XoaPhaoAsync(int id)
        {
            try
            {
                var result = await _phaoRepo.DeleteAsync(id);
                if (!result)
                    return (false, "Không tìm thấy phao với Id = " + id);

                return (true, null);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi xóa phao: " + ex.Message);
            }
        }

        public async Task<List<DieuPhoiPhaoRowDto>> GetDanhSachDieuPhoiAsync(string? search, int? tuyenLuongId)
        {
            var allPhao = await _phaoRepo.GetAllWithCurrentStatusAsync();

            var query = allPhao.AsEnumerable();

            if (tuyenLuongId.HasValue)
                query = query.Where(p => p.ViTriPhaoBHHienTai?.TuyenLuongId == tuyenLuongId.Value);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(p =>
                    (p.MaPhaoDayDu?.ToLower().Contains(s) ?? false) ||
                    (p.TenPhao?.ToLower().Contains(s) ?? false) ||
                    (p.KyHieuTaiSan?.ToLower().Contains(s) ?? false));
            }

            return query.Select(p => new DieuPhoiPhaoRowDto
            {
                Id = p.Id,
                MaPhaoDayDu = p.MaPhaoDayDu,
                TenPhao = p.TenPhao,
                TrangThaiHienTai = MapToTrangThaiHoatDong(p.TrangThaiHienTai),
                ViTriHienTai = p.ViTriPhaoBHHienTai?.MaPhaoBH,
                TuyenLuong = p.ViTriPhaoBHHienTai?.TuyenLuong?.TenTuyen,
                TuyenLuongId = p.ViTriPhaoBHHienTai?.TuyenLuongId,
                ViTriPhaoBHHienTaiId = p.ViTriPhaoBHHienTaiId
            }).ToList();
        }

        public async Task<(bool Success, string? Error, int Count)> DieuPhoiPhaoAsync(DieuPhoiRequestDto request)
        {
            try
            {
                if (request.Items == null || request.Items.Count == 0)
                    return (false, "Không có phao nào được điều phối.", 0);

                if (!request.NgayThucHien.HasValue)
                    request.NgayThucHien = DateTime.Now;

                var ngaySuKien = request.NgayThucHien.Value;

                int count = 0;
                foreach (var item in request.Items)
                {
                    var phao = await _phaoRepo.GetByIdForEditAsync(item.PhaoId);
                    if (phao == null) continue;

                    var newTrangThai = item.LoaiTrangThai;
                    var requireViTri = TrangThaiHoatDongPhao.RequireViTri(newTrangThai);

                    // Validate: Trên luồng phải có tuyến + vị trí
                    if (requireViTri)
                    {
                        if (!item.TuyenLuongId.HasValue)
                            return (false, $"Phao {phao.MaPhaoDayDu}: trạng thái 'Trên luồng' phải chọn tuyến luồng.", 0);
                        if (!item.ViTriPhaoBHId.HasValue)
                            return (false, $"Phao {phao.MaPhaoDayDu}: trạng thái 'Trên luồng' phải chọn vị trí phao BH.", 0);
                    }

                    int? newViTriId = requireViTri ? item.ViTriPhaoBHId : null;
                    var tinhTrang = TrangThaiHoatDongPhao.InferTinhTrang(newTrangThai);

                    // Snapshot vị trí mới
                    string? snapshotMaPhaoBH = null;
                    string? snapshotMaTuyen = null;
                    if (newViTriId.HasValue)
                    {
                        var viTriInfo = await _phaoRepo.GetViTriByIdAsync(newViTriId.Value);
                        snapshotMaPhaoBH = viTriInfo?.MaPhaoBH;
                        snapshotMaTuyen = viTriInfo?.TuyenLuong?.MaTuyen;
                    }

                    // Cập nhật phao master — trạng thái hiện tại
                    phao.TrangThaiHienTai = newTrangThai;
                    phao.ViTriPhaoBHHienTaiId = newViTriId;
                    phao.NgayCapNhat = DateTime.Now;
                    phao.NguoiCapNhat = request.NguoiThucHien;

                    // Tạo bản ghi lịch sử mới — KHÔNG ghi đè, LUÔN INSERT
                    var lichSu = new LichSuHoatDongPhao
                    {
                        PhaoId = phao.Id,
                        Nam = ngaySuKien.Year,
                        NgayBatDau = ngaySuKien,
                        LoaiTrangThai = newTrangThai,
                        MoTaTrangThai = tinhTrang,
                        ViTriPhaoBHId = newViTriId,
                        MaPhaoBH = snapshotMaPhaoBH,
                        MaTuyenLuong = snapshotMaTuyen,
                        DiaDiem = item.DiaDiem,
                        GhiChu = item.GhiChu,
                        NgayTao = DateTime.Now,
                        NguoiTao = request.NguoiThucHien
                    };

                    await _phaoRepo.AddLichSuHoatDongAsync(lichSu);
                    count++;
                }

                await _phaoRepo.SaveChangesAsync();
                return (true, null, count);
            }
            catch (Exception ex)
            {
                return (false, "Lỗi điều phối: " + ex.Message, 0);
            }
        }

        public async Task<VongDoiResponseDto> GetVongDoiPhaoAsync(int? tuyenLuongId)
        {
            var records = await _phaoRepo.GetLichSuHoatDongByTuyenAsync(tuyenLuongId);

            // Lấy thông tin tuyến luồng
            string? tuyenTen = null;
            string? tuyenMa = null;
            if (tuyenLuongId.HasValue)
            {
                var tuyenList = await _tuyenLuongRepo.GetAllActiveAsync();
                var tuyen = tuyenList.FirstOrDefault(t => t.Id == tuyenLuongId.Value);
                tuyenTen = tuyen?.TenTuyen;
                tuyenMa = tuyen?.MaTuyen;
            }

            // Group theo PhaoId → tạo từng VongDoiBuoyDto
            var grouped = records
                .GroupBy(r => r.PhaoId)
                .ToList();

            var buoys = new List<VongDoiBuoyDto>();
            var allYears = new HashSet<int>();
            var allPositions = new HashSet<string>();

            foreach (var group in grouped)
            {
                var phao = group.First().Phao;
                var maPhao = phao?.MaPhaoDayDu ?? $"Phao-{group.Key}";

                var steps = new List<VongDoiStepDto>();

                // Gửi TOÀN BỘ bản ghi (sắp xếp theo NgayBatDau ASC).
                // FE sẽ dedup: mỗi (năm + vị trí) chỉ render event mới nhất,
                // nhưng lưu toàn bộ để hiển thị đầy đủ lịch sử khi double click.
                var allRecords = group.OrderBy(r => r.NgayBatDau);

                // Lưu vị trí thực cuối cùng để kế thừa cho bản ghi Thu hồi / Trên bãi
                // (những bản ghi này không có ViTriPhaoBH → pos = "N/A" → không render được)
                var lastKnownPos = "N/A";

                foreach (var rec in allRecords)
                {
                    // Xác định vị trí hiển thị
                    var pos = rec.MaPhaoBH ?? rec.ViTriPhaoBH?.MaPhaoBH ?? "N/A";

                    // Map LoaiTrangThai DB → FE type + side
                    var (feType, side) = MapLoaiTrangThaiToFe(rec.LoaiTrangThai);

                    if (pos != "N/A")
                    {
                        // Cập nhật vị trí thực khi có bản ghi trên luồng
                        lastKnownPos = pos;
                    }
                    else if (lastKnownPos != "N/A")
                    {
                        // Thu hồi / Trên bãi không có vị trí riêng → hiện trên hàng vị trí cuối cùng
                        // Cột "Thu hồi về" (sl='R') trong cùng năm sẽ hiển thị trạng thái này
                        pos = lastKnownPos;
                    }
                    else
                    {
                        // Chưa có vị trí nào trước đó → bỏ qua bản ghi này
                        continue;
                    }

                    steps.Add(new VongDoiStepDto
                    {
                        Yr = rec.Nam,
                        Pos = pos,
                        Sl = side,
                        Type = feType,
                        Note = rec.GhiChu ?? rec.MoTaTrangThai,
                        Date = rec.NgayBatDau.ToString("dd/MM/yyyy")
                    });

                    allYears.Add(rec.Nam);
                    if (pos != "N/A") allPositions.Add(pos);
                }

                if (steps.Count > 0)
                {
                    buoys.Add(new VongDoiBuoyDto
                    {
                        Id = maPhao,
                        Steps = steps
                    });
                }
            }

            // Tạo danh sách years sorted
            var years = allYears.OrderBy(y => y).ToList();
            if (years.Count == 0)
            {
                var currentYear = DateTime.Now.Year;
                years = Enumerable.Range(currentYear - 5, 6).ToList();
            }

            // Tạo danh sách positions sorted
            var positions = allPositions.OrderBy(p => p).ToList();

            return new VongDoiResponseDto
            {
                Years = years,
                Positions = positions,
                Buoys = buoys,
                TuyenLuongTen = tuyenTen,
                TuyenLuongMa = tuyenMa
            };
        }

        #region Private Helpers

        /// <summary>
        /// Map LoaiTrangThai (DB) → FE type string + side (L/R)
        /// DB values: TREN_LUONG, THU_HOI, TREN_BAI, CHO_THUE, XIN_THANH_LY, SU_CO, BAO_TRI, DU_PHONG
        /// FE types: active, recalled, kho, incident, maintenance, transfer
        /// </summary>
        private static (string feType, string side) MapLoaiTrangThaiToFe(string? loaiTrangThai)
        {
            if (string.IsNullOrWhiteSpace(loaiTrangThai))
                return ("active", "L");

            var val = loaiTrangThai.Trim();

            // Case-insensitive comparison — DO NOT use ToUpper() because
            // Vietnamese diacritics (ồ, ề, …) break enum-style matching.
            static bool Eq(string a, string b) =>
                string.Equals(a, b, StringComparison.OrdinalIgnoreCase);

            if (Eq(val, "TREN_LUONG") || Eq(val, "Trên luồng"))
                return ("active", "L");

            if (Eq(val, "THU_HOI") || Eq(val, "Thu hồi"))
                return ("recalled", "R");

            if (Eq(val, "TREN_BAI") || Eq(val, "Trên bãi") || Eq(val, "DU_PHONG"))
                return ("kho", "R");

            if (Eq(val, "SU_CO") || Eq(val, "Sự cố") ||
                Eq(val, "SUA_CHUA") || Eq(val, "Sửa chữa") ||
                Eq(val, "MAT_DAU") || Eq(val, "Mất dấu"))
                return ("incident", "L");

            if (Eq(val, "BAO_TRI") || Eq(val, "Bảo trì"))
                return ("maintenance", "L");

            if (Eq(val, "CHO_THUE") || Eq(val, "Cho thuê"))
                return ("transfer", "L");

            if (Eq(val, "XIN_THANH_LY") || Eq(val, "Xin thanh lý"))
                return ("recalled", "R");

            return ("active", "L");
        }

        /// <summary>
        /// Map giá trị TrangThaiHienTai (cũ hoặc mới) sang TrangThaiHoatDong chuẩn.
        /// </summary>
        private static string MapToTrangThaiHoatDong(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return TrangThaiHoatDongPhao.ThuHoi;

            // Nếu đã là giá trị mới (5 lựa chọn)
            if (TrangThaiHoatDongPhao.TatCa.Contains(value)) return value;

            // Backward compat: map giá trị cũ
            var lower = value.ToLower();
            if (lower.Contains("trên luồng")) return TrangThaiHoatDongPhao.TrenLuong;
            if (lower.Contains("thu hồi") || lower.Contains("trên bãi")) return TrangThaiHoatDongPhao.ThuHoi;
            if (lower.Contains("sựa chữa") || lower.Contains("sỳa chữa") || lower.Contains("sự cố")) return TrangThaiHoatDongPhao.SuaChua;

            return TrangThaiHoatDongPhao.ThuHoi; // mặc định
        }

        private static string MapTrangThaiHienThi(string? trangThai)
        {
            if (string.IsNullOrEmpty(trangThai))
                return "Không xác định";

            var mapped = MapToTrangThaiHoatDong(trangThai);
            return mapped switch
            {
                TrangThaiHoatDongPhao.TrenLuong => "TRÊN LUỒNG",
                TrangThaiHoatDongPhao.ThuHoi    => "THU HỒI",
                TrangThaiHoatDongPhao.ChoThue   => "CHO THUÊ",
                TrangThaiHoatDongPhao.SuaChua   => "SỬA CHỮA",
                TrangThaiHoatDongPhao.MatDau    => "MẤT DẤU",
                _                              => trangThai.ToUpper()
            };
        }

        private static string MapTrangThaiCssClass(string? trangThai)
        {
            var mapped = MapToTrangThaiHoatDong(trangThai);
            return mapped switch
            {
                TrangThaiHoatDongPhao.TrenLuong => "badge-active",
                TrangThaiHoatDongPhao.ThuHoi    => "badge-thu-hoi",
                TrangThaiHoatDongPhao.ChoThue   => "badge-cho-thue",
                TrangThaiHoatDongPhao.SuaChua   => "badge-maint",
                TrangThaiHoatDongPhao.MatDau    => "badge-mat-dau",
                _                              => "bg-secondary-subtle text-secondary"
            };
        }

        #endregion
    }
}
