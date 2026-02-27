-- =================================================================
-- VMS BUOY MODULE - FULLY POPULATED SEED DATA
-- Bao gồm đầy đủ thông số kỹ thuật, tọa độ, thiết bị và bảo trì
-- =================================================================

-- USE VMS_DB;
GO

-- 1. XÓA DỮ LIỆU CŨ VÀ RESET IDENTITY
DELETE FROM LichSuHoatDongPhao;
DELETE FROM LichSuBaoTri;
DELETE FROM LichSuThayDoiThietBi;
DELETE FROM Phao;
DELETE FROM DmViTriPhaoBH;
DELETE FROM DmTuyenLuong;

DBCC CHECKIDENT ('LichSuHoatDongPhao', RESEED, 0);
DBCC CHECKIDENT ('LichSuBaoTri', RESEED, 0);
DBCC CHECKIDENT ('LichSuThayDoiThietBi', RESEED, 0);
DBCC CHECKIDENT ('Phao', RESEED, 0);
DBCC CHECKIDENT ('DmViTriPhaoBH', RESEED, 0);
DBCC CHECKIDENT ('DmTuyenLuong', RESEED, 0);
GO

-- =============================================
-- 2. THÊM DANH MỤC TUYẾN LUỒNG
-- =============================================
SET IDENTITY_INSERT DmTuyenLuong ON;
INSERT INTO DmTuyenLuong (Id, MaTuyen, TenTuyen, ThuTuHienThi, NguoiTao) VALUES 
(1, N'QN', N'Luồng Quy Nhơn', 1, N'SystemAdmin'),
(2, N'ĐTN', N'Luồng Dung Quất - Tiên Sa', 2, N'SystemAdmin'),
(3, N'PQ', N'Luồng Phú Quý', 3, N'SystemAdmin');
SET IDENTITY_INSERT DmTuyenLuong OFF;
GO

-- =============================================
-- 3. THÊM VỊ TRÍ PHAO BÁO HIỆU (CÓ TỌA ĐỘ)
-- =============================================
SET IDENTITY_INSERT DmViTriPhaoBH ON;
INSERT INTO DmViTriPhaoBH (Id, TuyenLuongId, SoViTri, MaPhaoBH, ToaDoThietKe, MoTa, ThuTuHienThi, NguoiTao) VALUES 
(1, 1, N'0', N'"0"-QN', N'13°46.70''N 109°15.20''E', N'Phao đón khách luồng QN', 1, N'SystemAdmin'),
(2, 1, N'1', N'"1"-QN', N'13°46.85''N 109°14.80''E', N'Cặp phao cửa luồng', 2, N'SystemAdmin'),
(3, 1, N'4A', N'"4A"-QN', N'13°47.10''N 109°13.50''E', N'Phao chuyển hướng', 3, N'SystemAdmin'),
(4, 2, N'17', N'"17"-ĐTN', N'15°24.50''N 108°47.20''E', N'Luồng vào cảng Dung Quất', 1, N'SystemAdmin'),
(5, 3, N'P1', N'P1-PQ', N'10°30.15''N 108°55.40''E', N'Luồng cập đảo Phú Quý', 1, N'SystemAdmin');
SET IDENTITY_INSERT DmViTriPhaoBH OFF;
GO

-- =============================================
-- 4. THÊM MASTER DATA PHAO (FULL THÔNG SỐ KỸ THUẬT)
-- =============================================
SET IDENTITY_INSERT Phao ON;
INSERT INTO Phao (
    Id, KyHieuTaiSan, MaPhaoDayDu, SoPhaoHienTai, TrangThaiHienTai, NguoiTao,
    DuongKinhPhao, ChieuCaoToanBo, HinhDang, VatLieu, MauSac,
    XichPhao_DuongKinh, XichPhao_ChieuDai, XichPhao_ThoiDiemSuDung,
    XichRua_DuongKinh, XichRua_ChieuDai, XichRua_ThoiDiemSuDung,
    Rua_TrongLuong, Rua_ThoiDiemSuDung,
    Den_ChungLoai, Den_KetNoiAIS, Den_DacTinhAnhSang, Den_ChieuXaTamSang, Den_NguonCapNangLuong, Den_ThoiDiemSuDung
) VALUES 
-- Phao D24 (Đỏ, báo hiệu mạn phải)
(1, N'KCHT40861', N'D24.006.04', 1, N'Trên bãi', N'System', 
 2.4, 4.5, N'Tháp', N'Thép', N'Đỏ', 
 28.0, 15.0, '2021-05-10', 32.0, 10.0, '2021-05-10', 1500.0, '2019-10-01',
 N'Sealite SL-75', 0, N'Fl(2) R 5s', 4.0, N'Solar 12V-12Ah', '2023-01-15'),

(2, N'KCHT40862', N'D24.020.16', 2, N'Trên bãi', N'System', 
 2.4, 4.5, N'Tháp', N'Thép', N'Đỏ', 
 28.0, 18.0, '2022-08-20', 32.0, 12.0, '2020-05-10', 1500.0, '2020-05-10',
 N'VMS-LED-155', 1, N'Fl R 3s', 5.0, N'Solar 12V-24Ah', '2024-02-10'),

-- Phao T26 (Xanh, báo hiệu mạn trái)
(3, N'KCHT40864', N'T26.002.14', 3, N'Trên bãi', N'System', 
 2.6, 5.5, N'Trụ', N'Thép', N'Xanh', 
 32.0, 20.0, '2023-11-01', 38.0, 15.0, '2023-11-01', 2000.0, '2023-11-01',
 N'Pharos Marine FA-250', 1, N'Fl(2) G 5s', 5.0, N'Solar 12V-24Ah', '2023-11-05'),

(4, N'KCHT40865', N'T26.016.12', 4, N'Trên bãi', N'System', 
 2.6, 5.5, N'Trụ', N'Thép', N'Xanh', 
 32.0, 22.0, '2020-01-15', 38.0, 15.0, '2020-01-15', 2000.0, '2018-06-20',
 N'Sealite SL-75', 0, N'Fl G 3s', 4.0, N'Solar 12V-12Ah', '2021-07-10'),

-- Phao DN24 (Đỏ, nổi, báo hiểm nguy hiểm)
(5, N'KCHT40868', N'DN24.037.02', 5, N'Trên bãi', N'System', 
 2.4, 5.0, N'Trụ Côn', N'Composite', N'Đỏ Đen', 
 28.0, 15.0, '2024-01-05', 32.0, 10.0, '2024-01-05', 1500.0, '2024-01-05',
 N'VMS-LED-155', 0, N'Q(2) W 5s', 3.0, N'Solar 12V-12Ah', '2024-01-05');
SET IDENTITY_INSERT Phao OFF;
GO

-- =============================================
-- 5. THÊM LỊCH SỬ HOẠT ĐỘNG (GHI NHẬN TỌA ĐỘ THỰC TẾ)
-- =============================================
INSERT INTO LichSuHoatDongPhao (PhaoId, Nam, NgayBatDau, LoaiTrangThai, MoTaTrangThai, ViTriPhaoBHId, MaPhaoBH, MaTuyenLuong, KinhDo, ViDo, GhiChu, NguoiTao) VALUES 
(1, 2024, '2024-01-10', N'TREN_LUONG', N'Hoạt động bình thường', 1, N'"0"-QN', N'QN', 109.253333, 13.778333, N'Lắp đặt định kỳ', N'SystemAdmin'),
(4, 2024, '2024-01-15', N'TREN_LUONG', N'Hoạt động bình thường', 3, N'"4A"-QN', N'QN', 109.225000, 13.785000, N'Chuyển từ bãi lên luồng', N'SystemAdmin'),
(3, 2024, '2024-02-05', N'TREN_LUONG', N'Hoạt động bình thường', 4, N'"17"-ĐTN', N'ĐTN', 108.786667, 15.408333, N'Lắp đặt phao mới', N'SystemAdmin'),
(2, 2024, '2024-03-01', N'TREN_LUONG', N'Hoạt động bình thường', 5, N'P1-PQ', N'PQ', 108.923333, 10.502500, N'Điều chuyển tuyến', N'SystemAdmin');

-- Cập nhật trạng thái Master
UPDATE p
SET TrangThaiHienTai = ls.MaPhaoBH, ViTriPhaoBHHienTaiId = ls.ViTriPhaoBHId
FROM Phao p INNER JOIN LichSuHoatDongPhao ls ON p.Id = ls.PhaoId WHERE ls.NgayKetThuc IS NULL;
GO

-- =============================================
-- 6. THÊM LỊCH SỬ BẢO TRÌ (TEST MODULE KHO & CHI PHÍ)
-- =============================================
INSERT INTO LichSuBaoTri (PhaoId, LoaiBaoTri, NgayBaoTri, NoiDungCongViec, KetQuaBaoTri, ChiPhi, DonViThucHien, NguoiPhuTrach, NguoiTao) VALUES 
(1, N'Bảo trì định kỳ', '2023-12-15', N'Cạo hàu, sơn lại vỏ phao, kiểm tra dòng điện đèn', N'Tốt, đủ điều kiện lên luồng', 15500000, N'Đội Bảo Đảm ATHH số 1', N'Nguyễn Văn A', N'SystemAdmin'),
(4, N'Sửa chữa đột xuất', '2023-11-20', N'Đèn chập chờn do lỏng giắc cắm, thay cáp nguồn', N'Đèn sáng bình thường theo đặc tính', 2100000, N'Đội Bảo Đảm ATHH số 2', N'Trần Văn B', N'SystemAdmin'),
(2, N'Bảo trì định kỳ', '2024-01-10', N'Bảo dưỡng rùa neo, kiểm tra độ mòn xích', N'Xích mòn 15%, vẫn trong giới hạn an toàn', 8500000, N'Trạm QLBH Phú Quý', N'Lê Văn C', N'SystemAdmin');
GO

-- =============================================
-- 7. THÊM LỊCH SỬ THAY ĐỔI THIẾT BỊ
-- =============================================
INSERT INTO LichSuThayDoiThietBi (PhaoId, LoaiThietBi, NgayThayDoi, ThongTinCu, ThongTinMoi, LyDoThayDoi, NguoiTao) VALUES 
(1, N'Đèn báo hiệu', '2023-01-15', N'Đèn cũ hỏng bo mạch (Sealite SL-70)', N'Lắp đèn mới Sealite SL-75', N'Hết hạn sử dụng, hỏng không khắc phục được', N'SystemAdmin'),
(2, N'Xích phao', '2022-08-20', N'Xích 28mm mòn quá 20%', N'Thay xích 28mm mới, chiều dài 18m', N'Đảm bảo an toàn neo buộc', N'SystemAdmin');
GO

PRINT N'✅ Đã khởi tạo Full Seed Data (Bao gồm Thông số KT, Tọa độ, Bảo trì, Thiết bị) thành công!';