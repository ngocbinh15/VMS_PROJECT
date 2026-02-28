using LANHossting.Application.DTOs.Buoy;
using LANHossting.Application.Interfaces.Buoy;

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
                SoPhaoBaoTri = tongSo - trenLuong - duPhong - suCo
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
                var ngaySuaChua = await _phaoRepo.GetNgaySuaChuaGanNhatAsync(p.Id);

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
                    NgaySuaChuaGanNhat = ngaySuaChua,
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
                phao.TrangThaiHienTai = dto.TrangThaiHienTai;
                phao.ViTriPhaoBHHienTaiId = dto.ViTriPhaoBHHienTaiId;

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

        private static string MapTrangThaiHienThi(string? trangThai)
        {
            if (string.IsNullOrEmpty(trangThai))
                return "Không xác định";

            var lower = trangThai.ToLower();
            if (lower.Contains("trên bãi") || lower.Contains("thu hồi"))
                return "KHÔNG SỬ DỤNG";
            if (lower.Contains("sự cố"))
                return "SỰ CỐ";

            // Nếu có mã vị trí (ví dụ: "4A"-QN) → đang hoạt động trên luồng
            if (trangThai.Contains('"') || trangThai.Contains('-'))
                return "HOẠT ĐỘNG";

            return trangThai.ToUpper();
        }

        private static string MapTrangThaiCssClass(string? trangThai)
        {
            if (string.IsNullOrEmpty(trangThai))
                return "bg-secondary-subtle text-secondary";

            var lower = trangThai.ToLower();
            if (lower.Contains("trên bãi") || lower.Contains("thu hồi"))
                return "bg-secondary-subtle text-secondary";
            if (lower.Contains("sự cố"))
                return "bg-danger-subtle text-danger";
            if (trangThai.Contains('"') || trangThai.Contains('-'))
                return "badge-active";

            return "badge-maint";
        }

        #endregion
    }
}
