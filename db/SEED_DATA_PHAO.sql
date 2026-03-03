-- =================================================================
-- VMS BUOY MODULE v1.1 - SEED DATA BỔ SUNG
-- Bao gồm: DmDonVi, DmTramQuanLy, DmTinhThanhPho
--          + Cập nhật Phao với các cột mới (hành chính, quyết định, đèn)
-- Chạy SAU seedt.sql (hoặc sau khi đã có dữ liệu phao cũ)
-- =================================================================

-- USE VMS_DB;
GO

-- =================================================================
-- 1. XÓA & RESET CÁC BẢNG MỚI
-- =================================================================
DELETE FROM LichSuHoatDongPhao;
DELETE FROM LichSuBaoTri;
DELETE FROM LichSuThayDoiThietBi;
DELETE FROM Phao;
DELETE FROM DmViTriPhaoBH;
DELETE FROM DmTuyenLuong;
DELETE FROM DmTramQuanLy;
DELETE FROM DmTinhThanhPho;
DELETE FROM DmDonVi;

DBCC CHECKIDENT ('LichSuHoatDongPhao', RESEED, 0);
DBCC CHECKIDENT ('LichSuBaoTri', RESEED, 0);
DBCC CHECKIDENT ('LichSuThayDoiThietBi', RESEED, 0);
DBCC CHECKIDENT ('Phao', RESEED, 0);
DBCC CHECKIDENT ('DmViTriPhaoBH', RESEED, 0);
DBCC CHECKIDENT ('DmTuyenLuong', RESEED, 0);
DBCC CHECKIDENT ('DmTramQuanLy', RESEED, 0);
DBCC CHECKIDENT ('DmTinhThanhPho', RESEED, 0);
DBCC CHECKIDENT ('DmDonVi', RESEED, 0);
GO

-- =================================================================
-- 2. DANH MỤC ĐƠN VỊ QUẢN LÝ / VẬN HÀNH
-- =================================================================
SET IDENTITY_INSERT DmDonVi ON;
INSERT INTO DmDonVi
  (Id, MaDonVi, TenDonVi, LoaiDonVi, DiaChi, SoDienThoai, ThuTuHienThi, NguoiTao)
VALUES
  (1, N'BĐANHNTB', N'Công ty bảo đảm an toàn hàng hải Nam Trung Bộ', N'Công ty', N'Số 68 Trần Hưng Đạo, TP Quy Nhơn, Bình Định', N'0256.3822641', 1, N'SystemAdmin'),
  (2, N'BĐANHPN', N'Công ty bảo đảm an toàn hàng hải Miền Nam', N'Công ty', N'Số 8 Đặng Thị Nhu, Quận 1, TP Hồ Chí Minh', N'028.38213232', 2, N'SystemAdmin'),
  (3, N'BĐANHPB', N'Công ty bảo đảm an toàn hàng hải Miền Bắc', N'Công ty', N'Số 3 Đào Duy Anh, Hà Nội', N'024.38253868', 3, N'SystemAdmin'),
  (4, N'BĐANHMT', N'Công ty bảo đảm an toàn hàng hải Miền Trung', N'Công ty', N'Số 90 Bạch Đằng, TP Đà Nẵng', N'0236.3822135', 4, N'SystemAdmin');
SET IDENTITY_INSERT DmDonVi OFF;
GO

-- =================================================================
-- 3. DANH MỤC TỈNH / THÀNH PHỐ
-- =================================================================
SET IDENTITY_INSERT DmTinhThanhPho ON;
INSERT INTO DmTinhThanhPho
  (Id, MaTinh, TenTinh, ThuTuHienThi, NguoiTao)
VALUES
  (1, N'QNH', N'Quảng Ngãi', 1, N'SystemAdmin'),
  (2, N'BD', N'Bình Định', 2, N'SystemAdmin'),
  (3, N'PY', N'Phú Yên', 3, N'SystemAdmin'),
  (4, N'KH', N'Khánh Hòa', 4, N'SystemAdmin'),
  (5, N'NT', N'Ninh Thuận', 5, N'SystemAdmin'),
  (6, N'BTH', N'Bình Thuận', 6, N'SystemAdmin'),
  (7, N'GL', N'Gia Lai', 7, N'SystemAdmin'),
  (8, N'KT', N'Kon Tum', 8, N'SystemAdmin'),
  (9, N'DLK', N'Đắk Lắk', 9, N'SystemAdmin'),
  (10, N'DLG', N'Lâm Đồng', 10, N'SystemAdmin'),
  (11, N'DN', N'Đà Nẵng', 11, N'SystemAdmin'),
  (12, N'QNM', N'Quảng Nam', 12, N'SystemAdmin');
SET IDENTITY_INSERT DmTinhThanhPho OFF;
GO

-- =================================================================
-- 4. DANH MỤC TRẠM QUẢN LÝ BÁO HIỆU
-- =================================================================
SET IDENTITY_INSERT DmTramQuanLy ON;
INSERT INTO DmTramQuanLy
  (Id, MaTram, TenTram, DonViChuQuanId, DiaDiem, SoDienThoai, ThuTuHienThi, NguoiTao)
VALUES
  (1, N'TQBHLHH_QN', N'Trạm quản lý báo hiệu luồng hàng hải Quy Nhơn', 1, N'Cảng Quy Nhơn, TP Quy Nhơn, Bình Định', N'0256.3822500', 1, N'SystemAdmin'),
  (2, N'TQBHLHH_NT', N'Trạm quản lý báo hiệu luồng hàng hải Nha Trang', 1, N'Cảng Nha Trang, TP Nha Trang, Khánh Hòa', N'0258.3512600', 2, N'SystemAdmin'),
  (3, N'TQBHLHH_PQ', N'Trạm quản lý báo hiệu luồng hàng hải Phú Quý', 1, N'Đảo Phú Quý, Huyện Phú Quý, Bình Thuận', N'0252.3860100', 3, N'SystemAdmin'),
  (4, N'TQBHLHH_DQ', N'Trạm quản lý báo hiệu luồng hàng hải Dung Quất', 4, N'Cảng Dung Quất, Quảng Ngãi', N'0255.3760200', 4, N'SystemAdmin'),
  (5, N'TQBHLHH_DDN', N'Trạm quản lý báo hiệu luồng hàng hải Đà Nẵng', 4, N'Cảng Tiên Sa, TP Đà Nẵng', N'0236.3873300', 5, N'SystemAdmin');
SET IDENTITY_INSERT DmTramQuanLy OFF;
GO

-- =================================================================
-- 5. TUYẾN LUỒNG (giữ nguyên từ seedt.sql)
-- =================================================================
SET IDENTITY_INSERT DmTuyenLuong ON;
INSERT INTO DmTuyenLuong
  (Id, MaTuyen, TenTuyen, ThuTuHienThi, NguoiTao)
VALUES
  (1, N'QN', N'Luồng Quy Nhơn', 1, N'SystemAdmin'),
  (2, N'ĐTN', N'Luồng Dung Quất - Tiên Sa', 2, N'SystemAdmin'),
  (3, N'PQ', N'Luồng Phú Quý', 3, N'SystemAdmin');
SET IDENTITY_INSERT DmTuyenLuong OFF;
GO

-- =================================================================
-- 6. VỊ TRÍ PHAO BÁO HIỆU (giữ nguyên từ seedt.sql)
-- =================================================================
SET IDENTITY_INSERT DmViTriPhaoBH ON;
INSERT INTO DmViTriPhaoBH
  (Id, TuyenLuongId, SoViTri, MaPhaoBH, ToaDoThietKe, MoTa, ThuTuHienThi, NguoiTao)
VALUES
  (1, 1, N'0', N'"0"-QN', N'13°46.70''N 109°15.20''E', N'Phao đón khách luồng QN', 1, N'SystemAdmin'),
  (2, 1, N'1', N'"1"-QN', N'13°46.85''N 109°14.80''E', N'Cặp phao cửa luồng', 2, N'SystemAdmin'),
  (3, 1, N'4A', N'"4A"-QN', N'13°47.10''N 109°13.50''E', N'Phao chuyển hướng', 3, N'SystemAdmin'),
  (4, 2, N'17', N'"17"-ĐTN', N'15°24.50''N 108°47.20''E', N'Luồng vào cảng Dung Quất', 1, N'SystemAdmin'),
  (5, 3, N'P1', N'P1-PQ', N'10°30.15''N 108°55.40''E', N'Luồng cập đảo Phú Quý', 1, N'SystemAdmin');
SET IDENTITY_INSERT DmViTriPhaoBH OFF;
GO

-- =================================================================
-- 7. PHAO CHỦ (FULL V1.1 - bao gồm tất cả cột mới)
-- =================================================================
SET IDENTITY_INSERT Phao ON;
INSERT INTO Phao
  (
  Id, KyHieuTaiSan, MaPhaoDayDu, TenPhao, SoPhaoHienTai,
  -- Kỹ thuật
  DuongKinhPhao, ChieuCaoToanBo, HinhDang, VatLieu, MauSac,
  -- Xích phao
  XichPhao_DuongKinh, XichPhao_ChieuDai, XichPhao_ThoiDiemSuDung,
  -- Xích rùa
  XichRua_DuongKinh, XichRua_ChieuDai, XichRua_ThoiDiemSuDung,
  -- Rùa
  Rua_TrongLuong, Rua_ThoiDiemSuDung,
  -- Đèn
  Den_ChungLoai, Den_KetNoiAIS, Den_DacTinhAnhSang, Den_ChieuXaTamSang,
  Den_ChieuCaoTamSangHaiDo, Den_NguonCapNangLuong, Den_ThoiDiemSuDung, Den_ThoiDiemSuaChua, Den_SoQuyetDinhTang,
  -- Thông tin chung (MỚI v1.1)
  ThoiGianSuDung, ThoiDiemThayTha, ThoiDiemSuaChuaGanNhat,
  -- Hành chính (MỚI v1.1)
  TramQuanLyId, TinhThanhPhoId, DonViQuanLyId, DonViVanHanhId,
  -- Quyết định & diện tích (MỚI v1.1)
  SoQuyetDinhTang, NgayQuyetDinhTang, DienTich,
  -- Trạng thái
  TrangThaiHienTai, NguoiTao
  )
VALUES
  -- ----------------------------------------------------------------
  -- Phao 1: D24.006.04 – Đỏ, tháp, luồng QN, Bình Định
  -- ----------------------------------------------------------------
  (1,
    N'KCHT40861', N'D24.006.04', N'Phao D2,4-006-04', 1,
    2.4, 4.5, N'Tháp', N'Thép', N'Đỏ',
    28.0, 15.0, '2021-05-10',
    32.0, 10.0, '2021-05-10',
    1.5, '2019-10-01',
    N'Sealite SL-75', 0, N'Fl(2) R 5s', 4.0, 3.8, N'Năng lượng mặt trời 12V-12Ah', '2021-05-10', '2023-06-20', N'QD2021/TANG/001',
    5, '2021-05-10', '2023-06-20',
    1, 2, 1, 1,
    N'QD2021/TANG/001', '2021-04-15', 4.52,
    N'Trên bãi', N'SystemAdmin'),

  -- ----------------------------------------------------------------
  -- Phao 2: D24.020.16 – Đỏ, tháp, luồng PQ, Bình Thuận
  -- ----------------------------------------------------------------
  (2,
    N'KCHT40862', N'D24.020.16', N'Phao D2,4-020-16', 2,
    2.4, 4.5, N'Tháp', N'Thép', N'Đỏ',
    28.0, 18.0, '2022-08-20',
    32.0, 12.0, '2022-08-20',
    1.5, '2020-05-10',
    N'VMS-LED-155', 1, N'Fl R 3s', 5.0, 4.2, N'Ắc quy và điện mặt trời', '2022-08-20', '2024-01-10', N'QD2022/TANG/009',
    3, '2022-08-20', '2024-01-10',
    3, 6, 1, 1,
    N'QD2022/TANG/009', '2022-07-01', 4.52,
    N'Trên bãi', N'SystemAdmin'),

  -- ----------------------------------------------------------------
  -- Phao 3: T26.002.14 – Xanh, trụ, luồng ĐTN, Quảng Ngãi
  -- ----------------------------------------------------------------
  (3,
    N'KCHT40864', N'T26.002.14', N'Phao T2,6-002-14', 3,
    2.6, 5.5, N'Trụ', N'Thép', N'Xanh',
    32.0, 20.0, '2023-11-01',
    38.0, 15.0, '2023-11-01',
    2.0, '2023-11-01',
    N'Pharos Marine FA-250', 1, N'Fl(2) G 5s', 5.0, 4.5, N'Năng lượng mặt trời 12V-24Ah', '2023-11-05', '2024-05-10', N'QD2023/TANG/014',
    1, '2023-11-01', '2024-05-10',
    4, 1, 4, 4,
    N'QD2023/TANG/014', '2023-10-20', 5.07,
    N'Trên bãi', N'SystemAdmin'),

  -- ----------------------------------------------------------------
  -- Phao 4: T26.016.12 – Xanh, trụ, luồng QN, Bình Định
  -- ----------------------------------------------------------------
  (4,
    N'KCHT40865', N'T26.016.12', N'Phao T2,6-016-12', 4,
    2.6, 5.5, N'Trụ', N'Thép', N'Xanh',
    32.0, 22.0, '2020-01-15',
    38.0, 15.0, '2020-01-15',
    2.0, '2018-06-20',
    N'Sealite SL-75', 0, N'Fl G 3s', 4.0, 3.8, N'Năng lượng mặt trời 12V-12Ah', '2020-01-15', '2023-11-25', N'QD2020/TANG/005',
    6, '2020-01-15', '2023-11-25',
    1, 2, 1, 1,
    N'QD2020/TANG/005', '2020-01-05', 5.07,
    N'Trên bãi', N'SystemAdmin'),

  -- ----------------------------------------------------------------
  -- Phao 5: DN24.037.02 – Đỏ Đen, trụ côn, luồng QN, Bình Định
  -- ----------------------------------------------------------------
  (5,
    N'KCHT40868', N'DN24.037.02', N'Phao DN2,4-037-02', 5,
    2.4, 5.0, N'Trụ Côn', N'Composite', N'Đỏ Đen',
    28.0, 15.0, '2024-01-05',
    32.0, 10.0, '2024-01-05',
    1.5, '2024-01-05',
    N'VMS-LED-155', 0, N'Q(2) W 5s', 3.0, 2.8, N'Năng lượng mặt trời 12V-12Ah', '2024-01-05', NULL, N'QD2024/TANG/002',
    0, '2024-01-05', NULL,
    1, 2, 1, 1,
    N'QD2024/TANG/002', '2024-01-02', 4.52,
    N'Trên bãi', N'SystemAdmin'),

  -- ----------------------------------------------------------------
  -- Phao 6: T26.020.23 – Xanh lục, hình thấp lưới (mẫu từ form thực tế)
  -- ----------------------------------------------------------------
  (6,
    N'KCHT40869', N'T26.020.23', N'Phao T2,6-020-23', 1,
    2.6, 7.47, N'Hình thấp lưới', N'Thép', N'Màu xanh lục',
    36.0, 15.0, '2025-10-12',
    36.0, 15.0, '2025-10-12',
    6.0, '2025-11-12',
    N'led KJDHF.SJDHF3', 1, N'Ánh sáng Xanh, Chớp đơn', NULL, 4.70, N'Ắc quy và điện mặt trời', '2024-01-01', '2024-09-12', N'11SFD',
    0, '2025-08-23', '2025-12-24',
    1, 7, 1, 1,
    N'2AFSAF', '2024-05-13', 5.23,
    N'Trên bãi', N'SystemAdmin');
SET IDENTITY_INSERT Phao OFF;
GO

-- =================================================================
-- 8. LỊCH SỬ HOẠT ĐỘNG (GHI NHẬN TỌA ĐỘ THỰC TẾ)
-- =================================================================
INSERT INTO LichSuHoatDongPhao
  (PhaoId, Nam, NgayBatDau, LoaiTrangThai, MoTaTrangThai,
  ViTriPhaoBHId, MaPhaoBH, MaTuyenLuong, KinhDo, ViDo, GhiChu, NguoiTao)
VALUES
  (1, 2024, '2024-01-10', N'TREN_LUONG', N'Hoạt động bình thường', 1, N'"0"-QN', N'QN', 109.253333, 13.778333, N'Lắp đặt định kỳ', N'SystemAdmin'),
  (4, 2024, '2024-01-15', N'TREN_LUONG', N'Hoạt động bình thường', 3, N'"4A"-QN', N'QN', 109.225000, 13.785000, N'Chuyển từ bãi lên luồng', N'SystemAdmin'),
  (3, 2024, '2024-02-05', N'TREN_LUONG', N'Hoạt động bình thường', 4, N'"17"-ĐTN', N'ĐTN', 108.786667, 15.408333, N'Lắp đặt phao mới', N'SystemAdmin'),
  (2, 2024, '2024-03-01', N'TREN_LUONG', N'Hoạt động bình thường', 5, N'P1-PQ', N'PQ', 108.923333, 10.502500, N'Điều chuyển tuyến', N'SystemAdmin'),
  (6, 2025, '2025-08-23', N'TREN_BAI', N'Trên bãi sau khi thay thả', NULL, NULL, NULL, 108.923333, 10.502500, N'Thay thả định kỳ năm 2025', N'SystemAdmin');

-- Đồng bộ trạng thái cache về bảng Phao
UPDATE p
SET TrangThaiHienTai     = ls.MaPhaoBH,
    ViTriPhaoBHHienTaiId = ls.ViTriPhaoBHId
FROM Phao p
  INNER JOIN LichSuHoatDongPhao ls ON p.Id = ls.PhaoId
WHERE ls.NgayKetThuc IS NULL
  AND ls.LoaiTrangThai = N'TREN_LUONG';
GO

-- =================================================================
-- 9. LỊCH SỬ BẢO TRÌ
-- =================================================================
INSERT INTO LichSuBaoTri
  (PhaoId, LoaiBaoTri, NgayBaoTri, NoiDungCongViec, KetQuaBaoTri, ChiPhi, DonViThucHien, NguoiPhuTrach, NguoiTao)
VALUES
  (1, N'Bảo trì định kỳ', '2023-12-15', N'Cạo hàu, sơn lại vỏ phao, kiểm tra dòng điện đèn', N'Tốt, đủ điều kiện lên luồng', 15500000, N'Đội BĐATHH số 1', N'Nguyễn Văn A', N'SystemAdmin'),
  (4, N'Sửa chữa đột xuất', '2023-11-20', N'Đèn chập chờn do lỏng giắc cắm, thay cáp nguồn', N'Đèn sáng bình thường theo đặc tính', 2100000, N'Đội BĐATHH số 2', N'Trần Văn B', N'SystemAdmin'),
  (2, N'Bảo trì định kỳ', '2024-01-10', N'Bảo dưỡng rùa neo, kiểm tra độ mòn xích', N'Xích mòn 15%, vẫn trong giới hạn an toàn', 8500000, N'Trạm QLBH Phú Quý', N'Lê Văn C', N'SystemAdmin'),
  (6, N'Bảo trì định kỳ', '2024-09-12', N'Kiểm tra và sửa chữa đèn báo hiệu led KJDHF.SJDHF3', N'Đèn hoạt động ổn định sau sửa chữa', 7800000, N'Trạm QLBH luồng QN', N'Phạm Văn D', N'SystemAdmin'),
  (6, N'Kiểm tra định kỳ', '2025-12-24', N'Kiểm tra tổng thể phao sau thời gian thả: thân phao, xích, rùa, đèn', N'Đạt yêu cầu kỹ thuật, tiếp tục hoạt động', 12000000, N'Trạm QLBH luồng QN', N'Phạm Văn D', N'SystemAdmin'),
  (3, N'Sửa chữa đột xuất', '2024-05-10', N'Thay bóng đèn Pharos Marine FA-250 bị hỏng do ngấm nước', N'Đèn hoạt động bình thường', 4500000, N'Đội BĐATHH Dung Quất', N'Hoàng Văn E', N'SystemAdmin');
GO

-- =================================================================
-- 10. LỊCH SỬ THAY ĐỔI THIẾT BỊ
-- =================================================================
INSERT INTO LichSuThayDoiThietBi
  (PhaoId, LoaiThietBi, NgayThayDoi, ThongTinCu, ThongTinMoi, LyDoThayDoi, NguoiTao)
VALUES
  (1, N'Đèn báo hiệu', '2021-05-10', N'Đèn cũ Sealite SL-70, hỏng bo mạch', N'Đèn mới Sealite SL-75, công suất cao hơn', N'Hết hạn sử dụng', N'SystemAdmin'),
  (2, N'Xích phao', '2022-08-20', N'Xích 28mm mòn >20%, chiều dài 15m', N'Xích 28mm mới, chiều dài 18m', N'Đảm bảo an toàn neo buộc', N'SystemAdmin'),
  (6, N'Xích phao', '2025-10-12', N'Xích cũ Ø32mm 12m, mòn 30%', N'Xích mới Ø36mm 15m', N'Thay thế định kỳ theo Quyết định 2AFSAF', N'SystemAdmin'),
  (6, N'Xích rùa', '2025-10-12', N'Xích rùa cũ Ø32mm 12m, mòn 25%', N'Xích rùa mới Ø36mm 15m', N'Thay thế đồng bộ theo QĐ 2AFSAF', N'SystemAdmin'),
  (6, N'Rùa', '2025-11-12', N'Rùa neo cũ 4.5 tấn, bị ăn mòn nặng', N'Rùa mới 6.0 tấn theo tiêu chuẩn kỹ thuật mới', N'Nâng cấp sức chịu tải', N'SystemAdmin'),
  (4, N'Xích rùa', '2020-01-15', N'Xích rùa cũ Ø32mm 12m', N'Xích rùa mới Ø38mm 15m', N'Lắp đặt mới', N'SystemAdmin'),
  (3, N'Đèn báo hiệu', '2024-05-10', N'Đèn Pharos Marine FA-250 bị ngấm nước hỏng bóng', N'Thay bóng đèn Pharos Marine FA-250 mới', N'Sự cố hư hỏng', N'SystemAdmin');
GO

PRINT N'✅ Đã khởi tạo Full Seed Data v1.1 thành công!';
PRINT N'';
PRINT N'📊 Thống kê dữ liệu đã nhập:';
PRINT N'   DmDonVi          : 4 bản ghi';
PRINT N'   DmTinhThanhPho   : 12 bản ghi';
PRINT N'   DmTramQuanLy     : 5 bản ghi';
PRINT N'   DmTuyenLuong     : 3 bản ghi';
PRINT N'   DmViTriPhaoBH    : 5 bản ghi';
PRINT N'   Phao             : 6 bản ghi (đầy đủ cột v1.1)';
PRINT N'   LichSuHoatDong   : 5 bản ghi';
PRINT N'   LichSuBaoTri     : 6 bản ghi';
PRINT N'   LichSuThayDoiTB  : 7 bản ghi';
PRINT N'';
PRINT N'🆕 Cột mới trong Phao đã có dữ liệu:';
PRINT N'   ThoiGianSuDung, ThoiDiemThayTha, ThoiDiemSuaChuaGanNhat';
PRINT N'   TramQuanLyId, TinhThanhPhoId, DonViQuanLyId, DonViVanHanhId';
PRINT N'   SoQuyetDinhTang, NgayQuyetDinhTang, DienTich';
PRINT N'   Den_ChieuCaoTamSangHaiDo, Den_SoQuyetDinhTang';
