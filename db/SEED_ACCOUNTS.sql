-- =============================================
-- SEED DATA CHO HỆ THỐNG ĐĂNG NHẬP VMS
-- Tạo vai trò và tài khoản test
-- =============================================

USE VMS_DB;
GO

-- Xóa dữ liệu cũ (nếu có)
DELETE FROM PhienLamViec;
DELETE FROM TaiKhoan;
DELETE FROM VaiTro;

-- Tạo các vai trò
INSERT INTO VaiTro
  (MaVaiTro, TenVaiTro, MoTa, NgayTao)
VALUES
  ('ADMIN', N'Quản trị viên', N'Có toàn quyền truy cập hệ thống, quản lý cả Phao và Kho', GETDATE()),
  ('NHAN_VIEN_KHO', N'Nhân viên Kho', N'Chỉ có quyền quản lý kho, vật liệu, nhập xuất', GETDATE()),
  ('NHAN_VIEN_PHAO', N'Nhân viên Phao', N'Chỉ có quyền quản lý phao, tuyến luồng, vị trí phao', GETDATE());

GO

-- Tạo tài khoản test
-- Mật khẩu mặc định: "123456" (chưa hash)
-- Trong thực tế nên hash password trước khi insert

DECLARE @AdminRoleId INT = (SELECT Id
FROM VaiTro
WHERE MaVaiTro = 'ADMIN');
DECLARE @KhoRoleId INT = (SELECT Id
FROM VaiTro
WHERE MaVaiTro = 'NHAN_VIEN_KHO');
DECLARE @PhaoRoleId INT = (SELECT Id
FROM VaiTro
WHERE MaVaiTro = 'NHAN_VIEN_PHAO');

-- Tài khoản Admin
INSERT INTO TaiKhoan
  (TenDangNhap, MatKhau, HoTen, Email, SoDienThoai, VaiTroId, TrangThai, NgayTao, NgayCapNhat)
VALUES
  ('admin', '123456', N'Nguyễn Ngọc Bình', 'binhnguyenngoc.it@gmail.com', '0384337239', @AdminRoleId, N'Hoạt động', GETDATE(), GETDATE());

-- Tài khoản Nhân viên Kho
INSERT INTO TaiKhoan
  (TenDangNhap, MatKhau, HoTen, Email, SoDienThoai, VaiTroId, TrangThai, NgayTao, NgayCapNhat)
VALUES
  ('kho01', '123456', N'Trần Thị Kho', 'kho01@vms.vn', '0902345678', @KhoRoleId, N'Hoạt động', GETDATE(), GETDATE()),
  ('kho02', '123456', N'Lê Văn Quản Kho', 'kho02@vms.vn', '0903456789', @KhoRoleId, N'Hoạt động', GETDATE(), GETDATE());

-- Tài khoản Nhân viên Phao
INSERT INTO TaiKhoan
  (TenDangNhap, MatKhau, HoTen, Email, SoDienThoai, VaiTroId, TrangThai, NgayTao, NgayCapNhat)
VALUES
  ('phao01', '123456', N'Phạm Văn Phao', 'phao01@vms.vn', '0904567890', @PhaoRoleId, N'Hoạt động', GETDATE(), GETDATE()),
  ('phao02', '123456', N'Hoàng Thị Báo Hiệu', 'phao02@vms.vn', '0905678901', @PhaoRoleId, N'Hoạt động', GETDATE(), GETDATE());

GO

-- Hiển thị kết quả
SELECT
  tk.Id,
  tk.TenDangNhap,
  tk.HoTen,
  vt.MaVaiTro,
  vt.TenVaiTro,
  tk.TrangThai
FROM TaiKhoan tk
  INNER JOIN VaiTro vt ON tk.VaiTroId = vt.Id
ORDER BY vt.Id, tk.Id;

GO

PRINT N'✅ Đã tạo xong dữ liệu test!';
PRINT N'';
PRINT N'📋 Danh sách tài khoản test:';
PRINT N'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
PRINT N'1. ADMIN:';
PRINT N'   Username: admin';
PRINT N'   Password: 123456';
PRINT N'   Quyền: Toàn quyền (Phao + Kho)';
PRINT N'';
PRINT N'2. NHÂN VIÊN KHO:';
PRINT N'   Username: kho01 / kho02';
PRINT N'   Password: 123456';
PRINT N'   Quyền: Chỉ quản lý Kho';
PRINT N'';
PRINT N'3. NHÂN VIÊN PHAO:';
PRINT N'   Username: phao01 / phao02';
PRINT N'   Password: 123456';
PRINT N'   Quyền: Chỉ quản lý Phao';
PRINT N'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
