-- =============================================
-- CLEANUP SCRIPT - XÓA DỮ LIỆU SEED WAREHOUSE
-- Chạy file này trước khi chạy SEED_WAREHOUSE_FIXED.sql
-- Date: 2026-01-27
-- =============================================

USE VMS_DB;
GO

PRINT N'========== BẮT ĐẦU XÓA DỮ LIỆU ==========';
PRINT N'';

-- Xóa theo thứ tự từ bảng con đến bảng cha (FK constraints)

-- 1. Xóa bảng phụ thuộc sâu nhất
PRINT N'Đang xóa ChiTietPhieuNhapXuat...';
DELETE FROM ChiTietPhieuNhapXuat;

PRINT N'Đang xóa LichSuVatLieu...';
DELETE FROM LichSuVatLieu;

PRINT N'Đang xóa PhieuNhapXuat...';
DELETE FROM PhieuNhapXuat;

-- 2. Xóa TonKho (phụ thuộc VatLieu và Kho)
PRINT N'Đang xóa TonKho...';
DELETE FROM TonKho;

-- 3. Xóa VatLieu (phụ thuộc NhomVatLieu và DonViTinh)
PRINT N'Đang xóa VatLieu...';
DELETE FROM VatLieu;

-- 4. Xóa Kho (có self-reference KhoMeId)
PRINT N'Đang xóa Kho con...';
DELETE FROM Kho WHERE LoaiKho = 'KHO_CON';

PRINT N'Đang xóa Kho mẹ...';
DELETE FROM Kho WHERE LoaiKho = 'KHO_ME';

-- 5. Xóa bảng master
PRINT N'Đang xóa DonViTinh...';
DELETE FROM DonViTinh;

PRINT N'Đang xóa NhomVatLieu...';
DELETE FROM NhomVatLieu;

PRINT N'';
PRINT N'========== XÓA DỮ LIỆU HOÀN TẤT ==========';
GO

-- Reset Identity (tùy chọn - nếu muốn ID bắt đầu lại từ 1)
PRINT N'';
PRINT N'Đang reset Identity...';

IF EXISTS (SELECT *
FROM sys.tables
WHERE name = 'TonKho')
  DBCC CHECKIDENT ('TonKho', RESEED, 0);

IF EXISTS (SELECT *
FROM sys.tables
WHERE name = 'VatLieu')
  DBCC CHECKIDENT ('VatLieu', RESEED, 0);

IF EXISTS (SELECT *
FROM sys.tables
WHERE name = 'Kho')
  DBCC CHECKIDENT ('Kho', RESEED, 0);

IF EXISTS (SELECT *
FROM sys.tables
WHERE name = 'DonViTinh')
  DBCC CHECKIDENT ('DonViTinh', RESEED, 0);

IF EXISTS (SELECT *
FROM sys.tables
WHERE name = 'NhomVatLieu')
  DBCC CHECKIDENT ('NhomVatLieu', RESEED, 0);

PRINT N'Reset Identity hoàn tất!';
GO

-- Kiểm tra kết quả
PRINT N'';
PRINT N'========== KIỂM TRA KẾT QUẢ ==========';
  SELECT 'NhomVatLieu' AS Bang, COUNT(*) AS SoLuong
  FROM NhomVatLieu
UNION ALL
  SELECT 'DonViTinh', COUNT(*)
  FROM DonViTinh
UNION ALL
  SELECT 'Kho', COUNT(*)
  FROM Kho
UNION ALL
  SELECT 'VatLieu', COUNT(*)
  FROM VatLieu
UNION ALL
  SELECT 'TonKho', COUNT(*)
  FROM TonKho;

PRINT N'';
PRINT N'Tất cả bảng đã được xóa sạch. Bạn có thể chạy file SEED_WAREHOUSE_FIXED.sql';
GO
