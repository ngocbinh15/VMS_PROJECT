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

                // ── Bắt snapshot GIÁ TRỊ CŨ trước khi thay đổi ──
                var oldTrangThaiHoatDong = MapToTrangThaiHoatDong(phao.TrangThaiHienTai);
                var oldViTriId = phao.ViTriPhaoBHHienTaiId;

                // ── Xử lý TrangThaiHoatDong & quy tắc nghiệp vụ ──
                var newTrangThaiHoatDong = dto.TrangThaiHoatDong ?? TrangThaiHoatDongPhao.ThuHoi;
                var requireViTri = TrangThaiHoatDongPhao.RequireViTri(newTrangThaiHoatDong);

                int? newViTriId = requireViTri ? dto.ViTriPhaoBHHienTaiId : null;

                // TinhTrang suy ra từ TrangThaiHoatDong
                var tinhTrang = TrangThaiHoatDongPhao.InferTinhTrang(newTrangThaiHoatDong);

                // Map DTO → Entity (MaLoaiPhao is computed, skip it)
                phao.KyHieuTaiSan = dto.KyHieuTaiSan;
                phao.MaPhaoDayDu = dto.MaPhaoDayDu;
                phao.TenPhao = dto.TenPhao;
                phao.SoPhaoHienTai = dto.SoPhaoHienTai;
                phao.DuongKinhPhao = dto.DuongKinhPhao;
                phao.ChieuCaoToanBo = dto.ChieuCaoToanBo;
                phao.HinhDang = dto.HinhDang;
                phao.VatLieu = dto.VatLieu;
                phao.MauSac = dto.MauSac;
                // Lưu TrangThaiHoatDong vào TrangThaiHienTai; TinhTrang được hiển thị từ logic
                phao.TrangThaiHienTai = newTrangThaiHoatDong;
                phao.ViTriPhaoBHHienTaiId = newViTriId;

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

                // ── GHI LỊCH SỬ nếu phát hiện thay đổi hoạt động ──
                bool changed = oldTrangThaiHoatDong != newTrangThaiHoatDong
                            || oldViTriId != newViTriId;

                if (changed)
                {
                    // Lấy snapshot vị trí mới
                    string? snapshotMaPhaoBH = null;
                    string? snapshotMaTuyen = null;

                    if (newViTriId.HasValue)
                    {
                        var viTriInfo = await _phaoRepo.GetViTriByIdAsync(newViTriId.Value);
                        snapshotMaPhaoBH = viTriInfo?.MaPhaoBH;
                        snapshotMaTuyen = viTriInfo?.TuyenLuong?.MaTuyen;
                    }

                    var lichSu = new LichSuHoatDongPhao
                    {
                        PhaoId = phao.Id,
                        Nam = DateTime.Now.Year,
                        NgayBatDau = DateTime.Today,
                        LoaiTrangThai = newTrangThaiHoatDong,
                        MoTaTrangThai = tinhTrang,
                        ViTriPhaoBHId = newViTriId,
                        MaPhaoBH = snapshotMaPhaoBH,
                        MaTuyenLuong = snapshotMaTuyen,
                        GhiChu = dto.GhiChuLichSu,
                        NgayTao = DateTime.Now,
                        NguoiTao = dto.NguoiCapNhat
                    };

                    await _phaoRepo.AddLichSuHoatDongAsync(lichSu);
                }

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

        #region Private Helpers

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
