USE VMS_DB;
GO

-- =============================================================================
-- MODULE QUẢN LÝ KHO VẬT LIỆU + AUTHENTICATION/SESSION CHO VMS
-- =============================================================================
-- PHẦN DÙNG CHUNG (Warehouse + Buoy):
-- 1. VaiTro: Phân quyền 2 cấp (Admin, Nhân viên)
-- 2. TaiKhoan: Quản lý tài khoản cơ bản
-- 3. PhienLamViec: Log phiên làm việc từ đăng nhập → đăng xuất
-- 
-- PHẦN WAREHOUSE ONLY (HOÀN TOÀN ĐỘC LẬP - KHÔNG LIÊN QUAN PHAO):
-- 1. Kho: Quản lý kho mẹ + 30 kho con
-- 2. VatLieu: Danh mục vật liệu tổng quát (xích, neo, điện, sơn, hóa chất...)
-- 3. TonKho: Theo dõi tồn kho real-time
-- 4. PhieuNhapXuat: Phiếu nhập/xuất/chuyển kho với truy xuất nguồn gốc
-- 5. LichSuVatLieu: Lịch sử thay đổi chi tiết (audit trail)
-- 
-- LƯU Ý QUAN TRỌNG:
-- - Module này KHÔNG chứa DmTramQuanLy (thuộc Buoy module)
-- - Module này KHÔNG liên quan đến Phao, LuồngBáoHiệu, hoặc nghiệp vụ hàng hải
-- - TaiKhoan.TramQuanLyId và Kho.TramQuanLyId đã bị loại bỏ
-- =============================================================================

-- =============================================================================
-- 1. HỆ THỐNG NGƯỜI DÙNG & PHÂN QUYỀN (DÙNG CHUNG)
-- =============================================================================
-- Chỉ bao gồm: VaiTro, TaiKhoan, PhienLamViec
-- KHÔNG bao gồm DmTramQuanLy (thuộc Buoy module)
-- =============================================================================

-- Bảng Vai trò
CREATE TABLE VaiTro
(
  Id INT PRIMARY KEY IDENTITY(1,1),
  MaVaiTro NVARCHAR(20) NOT NULL UNIQUE,
  -- 'ADMIN', 'NHAN_VIEN_KHO', 'NHAN_VIEN_PHAO'
  TenVaiTro NVARCHAR(100) NOT NULL,
  MoTa NVARCHAR(MAX),
  NgayTao DATETIME DEFAULT GETDATE()
);

-- Bảng Tài khoản
CREATE TABLE TaiKhoan
(
  Id INT PRIMARY KEY IDENTITY(1,1),
  TenDangNhap NVARCHAR(50) NOT NULL UNIQUE,
  MatKhau NVARCHAR(255) NOT NULL,
  -- Hash password
  HoTen NVARCHAR(200) NOT NULL,
  Email NVARCHAR(200),
  SoDienThoai NVARCHAR(20),
  VaiTroId INT NOT NULL,
  TrangThai NVARCHAR(50) DEFAULT N'Hoạt động',
  -- Hoạt động / Tạm khóa / Đã xóa
  NgayTao DATETIME DEFAULT GETDATE(),
  NgayCapNhat DATETIME DEFAULT GETDATE(),
  NguoiTao INT,
  -- FK đến TaiKhoan (Admin tạo)

  FOREIGN KEY (VaiTroId) REFERENCES VaiTro(Id),
  FOREIGN KEY (NguoiTao) REFERENCES TaiKhoan(Id)
);

-- Bảng Phiên làm việc (Session)
CREATE TABLE PhienLamViec
(
  Id INT PRIMARY KEY IDENTITY(1,1),
  TaiKhoanId INT NOT NULL,
  ThoiGianDangNhap DATETIME NOT NULL DEFAULT GETDATE(),
  ThoiGianDangXuat DATETIME NULL,
  -- NULL = Đang hoạt động
  DiaChi_IP NVARCHAR(50),
  ThietBi NVARCHAR(200),
  -- User Agent
  TrangThai NVARCHAR(50) DEFAULT N'Đang hoạt động',
  -- Đang hoạt động / Đã đăng xuất / Hết phiên
  GhiChu NVARCHAR(MAX),

  FOREIGN KEY (TaiKhoanId) REFERENCES TaiKhoan(Id)
);

-- =============================================================================
-- 2. HỆ THỐNG KHO (WAREHOUSE ONLY - HOÀN TOÀN ĐỘC LẬP)
-- =============================================================================
-- Chỉ quản lý vật liệu, kho, tồn kho, phiếu nhập/xuất
-- KHÔNG liên quan đến phao, tuyến luồng, trạm quản lý
-- =============================================================================

-- Bảng Kho
CREATE TABLE Kho
(
  Id INT PRIMARY KEY IDENTITY(1,1),
  MaKho NVARCHAR(50) NOT NULL UNIQUE,
  -- 'KHO_ME', 'KHO_01', 'KHO_02'...
  TenKho NVARCHAR(200) NOT NULL,
  LoaiKho NVARCHAR(20) NOT NULL,
  -- 'KHO_ME', 'KHO_CON'
  KhoMeId INT NULL,
  -- FK đến chính bảng Kho (NULL nếu là kho mẹ)
  DiaChi NVARCHAR(MAX),
  NguoiPhuTrach INT,
  -- FK đến TaiKhoan
  DienTich DECIMAL(10, 2),
  -- m2
  SucChua DECIMAL(18, 2),
  -- Tấn / m3
  TrangThai NVARCHAR(50) DEFAULT N'Hoạt động',
  MoTa NVARCHAR(MAX),
  NgayTao DATETIME DEFAULT GETDATE(),

  FOREIGN KEY (KhoMeId) REFERENCES Kho(Id),
  FOREIGN KEY (NguoiPhuTrach) REFERENCES TaiKhoan(Id)
);

-- =============================================================================
-- 3. VẬT LIỆU
-- =============================================================================

-- Danh mục Nhóm vật liệu
CREATE TABLE NhomVatLieu
(
  Id INT PRIMARY KEY IDENTITY(1,1),
  MaNhom NVARCHAR(50) NOT NULL UNIQUE,
  TenNhom NVARCHAR(200) NOT NULL,
  MoTa NVARCHAR(MAX)
);

-- Danh mục Đơn vị tính
CREATE TABLE DonViTinh
(
  Id INT PRIMARY KEY IDENTITY(1,1),
  MaDonVi NVARCHAR(20) NOT NULL UNIQUE,
  -- 'CAI', 'KG', 'TAN', 'M', 'M2', 'M3'
  TenDonVi NVARCHAR(100) NOT NULL
);

-- Bảng Vật liệu
CREATE TABLE VatLieu
(
  Id INT PRIMARY KEY IDENTITY(1,1),
  MaVatLieu NVARCHAR(50) NOT NULL UNIQUE,
  TenVatLieu NVARCHAR(200) NOT NULL,
  NhomVatLieuId INT,
  DonGia DECIMAL(18,2) NOT NULL DEFAULT 0,
  DonViTinhId INT NOT NULL,
  MoTa NVARCHAR(MAX),
  QuyDinhBaoQuan NVARCHAR(MAX),
  -- Hướng dẫn bảo quản
  MucToiThieu DECIMAL(18, 2),
  -- Mức tồn tối thiểu để cảnh báo
  MucToiDa DECIMAL(18, 2),
  -- Mức tồn tối đa
  TrangThai NVARCHAR(50) DEFAULT N'Đang sử dụng',
  -- Đang sử dụng / Ngừng sử dụng
  NgayTao DATETIME DEFAULT GETDATE(),

  FOREIGN KEY (NhomVatLieuId) REFERENCES NhomVatLieu(Id),
  FOREIGN KEY (DonViTinhId) REFERENCES DonViTinh(Id)
);

-- =============================================================================
-- 4. TỒN KHO (REAL-TIME INVENTORY)
-- =============================================================================

-- Bảng Tồn kho
CREATE TABLE TonKho
(
  Id INT PRIMARY KEY IDENTITY(1,1),
  VatLieuId INT NOT NULL,
  KhoId INT NOT NULL,
  SoLuongTon DECIMAL(18, 3) NOT NULL DEFAULT 0,
  -- Số lượng hiện tại
  SoLuongDatCho DECIMAL(18, 3) DEFAULT 0,
  -- Số lượng đang được đặt chỗ cho xuất kho
  SoLuongKhaDung AS (SoLuongTon - SoLuongDatCho) PERSISTED,
  -- Số lượng khả dụng
  ViTri NVARCHAR(100),
  -- Vị trí trong kho (Kệ A1, Khu B...)
  NgayCapNhat DATETIME DEFAULT GETDATE(),

  FOREIGN KEY (VatLieuId) REFERENCES VatLieu(Id),
  FOREIGN KEY (KhoId) REFERENCES Kho(Id),
  CONSTRAINT UK_TonKho UNIQUE (VatLieuId, KhoId)
);

-- =============================================================================
-- 5. PHIẾU NHẬP XUẤT
-- =============================================================================

-- Bảng Phiếu Nhập Xuất
CREATE TABLE PhieuNhapXuat
(
  Id INT PRIMARY KEY IDENTITY(1,1),
  MaPhieu NVARCHAR(50) NOT NULL UNIQUE,
  -- PN2024001, PX2024001
  LoaiPhieu NVARCHAR(20) NOT NULL,
  -- 'NHAP_KHO', 'XUAT_KHO', 'CHUYEN_KHO', 'KIEM_KE', 'DIEU_CHINH'
  PhienLamViecId INT NOT NULL,
  -- FK đến PhienLamViec
  TaiKhoanId INT NOT NULL,
  -- Người tạo phiếu
  NgayPhieu DATE NOT NULL,
  -- Ngày lập phiếu
  NgayThucHien DATETIME,
  -- Thời điểm thực hiện nhập/xuất

  -- KHO
  KhoNguonId INT NULL,
  -- Kho nguồn (xuất/chuyển)
  KhoNhapId INT NULL,
  -- Kho nhập (nhập/chuyển)

  -- THÔNG TIN PHIẾU
  LyDo NVARCHAR(500),
  -- Lý do nhập/xuất
  NguoiGiaoHang NVARCHAR(200),
  -- Với phiếu nhập
  DonViCungCap NVARCHAR(200),
  -- Nhà cung cấp
  SoHoaDon NVARCHAR(100),
  -- Số hóa đơn mua hàng
  NguoiNhanHang NVARCHAR(200),
  -- Với phiếu xuất
  DonViNhan NVARCHAR(200),
  -- Đơn vị nhận hàng

  -- TRẠNG THÁI & DUYỆT
  TrangThai NVARCHAR(50) DEFAULT N'Nháp',
  -- Nháp / Chờ duyệt / Đã duyệt / Đã hủy / Hoàn thành
  NguoiDuyet INT,
  -- FK đến TaiKhoan
  NgayDuyet DATETIME,
  LyDoHuy NVARCHAR(500),

  GhiChu NVARCHAR(MAX),
  NgayTao DATETIME DEFAULT GETDATE(),
  NgayCapNhat DATETIME DEFAULT GETDATE(),

  FOREIGN KEY (PhienLamViecId) REFERENCES PhienLamViec(Id),
  FOREIGN KEY (TaiKhoanId) REFERENCES TaiKhoan(Id),
  FOREIGN KEY (KhoNguonId) REFERENCES Kho(Id),
  FOREIGN KEY (KhoNhapId) REFERENCES Kho(Id),
  FOREIGN KEY (NguoiDuyet) REFERENCES TaiKhoan(Id)
);

-- Bảng Chi tiết Phiếu Nhập Xuất
CREATE TABLE ChiTietPhieuNhapXuat
(
  Id INT PRIMARY KEY IDENTITY(1,1),
  PhieuNhapXuatId INT NOT NULL,
  VatLieuId INT NOT NULL,
  SoLuong DECIMAL(18, 3) NOT NULL,
  DonGia DECIMAL(18, 2),
  -- Đơn giá (nếu có)
  ThanhTien AS (SoLuong * DonGia) PERSISTED,
  -- Thành tiền
  ViTri NVARCHAR(100),
  -- Vị trí trong kho
  SoLo NVARCHAR(100),
  -- Số lô sản xuất
  NgaySanXuat DATE,
  NgayHetHan DATE,
  TinhTrangVatLieu NVARCHAR(200),
  -- Tốt / Hỏng / Cần bảo trì
  GhiChu NVARCHAR(MAX),

  FOREIGN KEY (PhieuNhapXuatId) REFERENCES PhieuNhapXuat(Id),
  FOREIGN KEY (VatLieuId) REFERENCES VatLieu(Id)
);

-- =============================================================================
-- 6. LỊCH SỬ THAY ĐỔI VẬT LIỆU (AUDIT LOG)
-- =============================================================================

-- Bảng Lịch sử Vật liệu
CREATE TABLE LichSuVatLieu
(
  Id INT PRIMARY KEY IDENTITY(1,1),
  VatLieuId INT NOT NULL,
  KhoId INT NOT NULL,
  PhieuNhapXuatId INT,
  -- FK đến PhieuNhapXuat (nếu có)
  PhienLamViecId INT NOT NULL,
  TaiKhoanId INT NOT NULL,
  -- Ai thực hiện

  -- THAY ĐỔI
  LoaiThayDoi NVARCHAR(50) NOT NULL,
  -- 'NHAP', 'XUAT', 'CHUYEN_DI', 'CHUYEN_DEN', 'DIEU_CHINH', 'KIEM_KE'
  SoLuongTruoc DECIMAL(18, 3),
  SoLuongThayDoi DECIMAL(18, 3),
  -- +5 (nhập), -3 (xuất)
  SoLuongSau DECIMAL(18, 3),

  KhoLienQuanId INT,
  -- Kho liên quan (kho đích khi chuyển)

  LyDo NVARCHAR(500),
  GhiChu NVARCHAR(MAX),
  ThoiGian DATETIME DEFAULT GETDATE(),

  FOREIGN KEY (VatLieuId) REFERENCES VatLieu(Id),
  FOREIGN KEY (KhoId) REFERENCES Kho(Id),
  FOREIGN KEY (PhieuNhapXuatId) REFERENCES PhieuNhapXuat(Id),
  FOREIGN KEY (PhienLamViecId) REFERENCES PhienLamViec(Id),
  FOREIGN KEY (TaiKhoanId) REFERENCES TaiKhoan(Id),
  FOREIGN KEY (KhoLienQuanId) REFERENCES Kho(Id)
);

-- =============================================================================
-- 7. DỮ LIỆU MẪU
-- =============================================================================

-- Vai trò
INSERT INTO VaiTro
  (MaVaiTro, TenVaiTro, MoTa)
VALUES
  (N'ADMIN', N'Quản trị viên', N'Toàn quyền: Tạo user, phân quyền, xem tất cả'),
  (N'NHAN_VIEN', N'Nhân viên kho', N'Xem tất cả phiếu nhập xuất, báo cáo tồn kho, thao tác phiếu');

-- Đơn vị tính
INSERT INTO DonViTinh
  (MaDonVi, TenDonVi)
VALUES
  (N'CAI', N'Cái'),
  (N'BO', N'Bộ'),
  (N'KG', N'Kilogram'),
  (N'TAN', N'Tấn'),
  (N'M', N'Mét'),
  (N'M2', N'Mét vuông'),
  (N'M3', N'Mét khối'),
  (N'L', N'Lít'),
  (N'THUNG', N'Thùng');

-- Nhóm vật liệu (Warehouse - Vật liệu tổng quát)
INSERT INTO NhomVatLieu
  (MaNhom, TenNhom, MoTa)
VALUES
  (N'XICH', N'Xích và dây cáp', N'Các loại xích, dây cáp thép'),
  (N'NEO', N'Neo và phụ kiện', N'Neo, rùa, phụ kiện neo'),
  (N'DIEN', N'Thiết bị điện', N'Pin, ắc quy, dây điện, đèn'),
  (N'SON', N'Sơn và phủ liệu', N'Sơn bảo dưỡng, chống rỉ'),
  (N'CO_KHI', N'Cơ khí', N'Ốc vít, bu lông, đệm, gasket'),
  (N'HOA_CHAT', N'Hóa chất', N'Hóa chất tẩy rửa, chống rỉ'),
  (N'CONG_CU', N'Công cụ dụng cụ', N'Công cụ cầm tay, thiết bị đo'),
  (N'VAT_TU', N'Vật tư tiêu hao', N'Khăn, giấy, bao bì, vật tư văn phòng'),
  (N'KHAC', N'Khác', N'Vật liệu khác');

-- Tạo Kho Mẹ
INSERT INTO Kho
  (MaKho, TenKho, LoaiKho, KhoMeId, DiaChi, DienTich, SucChua, TrangThai, MoTa)
VALUES
  (N'KHO_ME', N'Kho Tổng - Trung Tâm', N'KHO_ME', NULL, N'Đường Trần Hưng Đạo, Quy Nhơn', 500.00, 100.00, N'Hoạt động', N'Kho mẹ trung tâm quản lý tất cả vật liệu');

-- Tạo 30 Kho Con
DECLARE @i INT = 1;
DECLARE @KhoMeId INT = (SELECT Id
FROM Kho
WHERE MaKho = N'KHO_ME');

WHILE @i <= 30
BEGIN
  INSERT INTO Kho
    (MaKho, TenKho, LoaiKho, KhoMeId, DienTich, SucChua, TrangThai)
  VALUES
    (N'KHO_' + RIGHT('00' + CAST(@i AS NVARCHAR), 2),
      N'Kho Con ' + CAST(@i AS NVARCHAR),
      N'KHO_CON',
      @KhoMeId,
      20.00,
      5.00,
      N'Hoạt động');

  SET @i = @i + 1;
END;

GO

-- =============================================================================
-- 8. INDEX TỐI ƯU
-- =============================================================================
CREATE INDEX IX_TaiKhoan_VaiTro ON TaiKhoan(VaiTroId);
CREATE INDEX IX_TaiKhoan_TrangThai ON TaiKhoan(TrangThai);
CREATE INDEX IX_PhienLamViec_TaiKhoan ON PhienLamViec(TaiKhoanId);
CREATE INDEX IX_PhienLamViec_TrangThai ON PhienLamViec(TrangThai);

CREATE INDEX IX_Kho_LoaiKho ON Kho(LoaiKho);
CREATE INDEX IX_Kho_KhoMe ON Kho(KhoMeId);

CREATE INDEX IX_TonKho_VatLieu ON TonKho(VatLieuId);
CREATE INDEX IX_TonKho_Kho ON TonKho(KhoId);

CREATE INDEX IX_PhieuNhapXuat_LoaiPhieu ON PhieuNhapXuat(LoaiPhieu);
CREATE INDEX IX_PhieuNhapXuat_TrangThai ON PhieuNhapXuat(TrangThai);
CREATE INDEX IX_PhieuNhapXuat_TaiKhoan ON PhieuNhapXuat(TaiKhoanId);
CREATE INDEX IX_PhieuNhapXuat_PhienLamViec ON PhieuNhapXuat(PhienLamViecId);
CREATE INDEX IX_PhieuNhapXuat_NgayPhieu ON PhieuNhapXuat(NgayPhieu);

CREATE INDEX IX_LichSuVatLieu_VatLieu ON LichSuVatLieu(VatLieuId);
CREATE INDEX IX_LichSuVatLieu_Kho ON LichSuVatLieu(KhoId);
CREATE INDEX IX_LichSuVatLieu_TaiKhoan ON LichSuVatLieu(TaiKhoanId);
CREATE INDEX IX_LichSuVatLieu_PhienLamViec ON LichSuVatLieu(PhienLamViecId);
CREATE INDEX IX_LichSuVatLieu_ThoiGian ON LichSuVatLieu(ThoiGian);

GO

-- =============================================================================
-- 9. VIEW BÁO CÁO TỒN KHO
-- =============================================================================

-- View Tồn kho theo Kho Con
CREATE VIEW vw_TonKho_TheoKhoCon
AS
  SELECT
    k.MaKho,
    k.TenKho,
    k.LoaiKho,
    km.TenKho AS TenKhoMe,
    vl.MaVatLieu,
    vl.TenVatLieu,
    nh.TenNhom AS NhomVatLieu,
    dv.TenDonVi AS DonViTinh,
    tk.SoLuongTon,
    tk.SoLuongDatCho,
    tk.SoLuongKhaDung,
    tk.ViTri,
    tk.NgayCapNhat,
    -- Cảnh báo tồn kho
    CASE 
        WHEN tk.SoLuongTon <= vl.MucToiThieu THEN N'Tồn thấp'
        WHEN tk.SoLuongTon >= vl.MucToiDa THEN N'Tồn cao'
        ELSE N'Bình thường'
    END AS TrangThaiTon
  FROM TonKho tk
    INNER JOIN Kho k ON tk.KhoId = k.Id
    LEFT JOIN Kho km ON k.KhoMeId = km.Id
    INNER JOIN VatLieu vl ON tk.VatLieuId = vl.Id
    LEFT JOIN NhomVatLieu nh ON vl.NhomVatLieuId = nh.Id
    INNER JOIN DonViTinh dv ON vl.DonViTinhId = dv.Id;
GO

-- View Tổng hợp Tồn kho Kho Mẹ (bao gồm tất cả kho con)
CREATE VIEW vw_TonKho_TongHop
AS
  SELECT
    vl.MaVatLieu,
    vl.TenVatLieu,
    nh.TenNhom AS NhomVatLieu,
    dv.TenDonVi AS DonViTinh,
    SUM(tk.SoLuongTon) AS TongSoLuongTon,
    SUM(tk.SoLuongDatCho) AS TongSoLuongDatCho,
    SUM(tk.SoLuongKhaDung) AS TongSoLuongKhaDung,
    COUNT(DISTINCT tk.KhoId) AS SoKhoCo,
    vl.MucToiThieu,
    vl.MucToiDa,
    CASE 
        WHEN SUM(tk.SoLuongTon) <= vl.MucToiThieu THEN N'Cảnh báo: Tồn thấp'
        WHEN SUM(tk.SoLuongTon) >= vl.MucToiDa THEN N'Cảnh báo: Tồn cao'
        ELSE N'Bình thường'
    END AS CanhBao
  FROM TonKho tk
    INNER JOIN VatLieu vl ON tk.VatLieuId = vl.Id
    LEFT JOIN NhomVatLieu nh ON vl.NhomVatLieuId = nh.Id
    INNER JOIN DonViTinh dv ON vl.DonViTinhId = dv.Id
  GROUP BY vl.MaVatLieu, vl.TenVatLieu, nh.TenNhom, dv.TenDonVi, vl.MucToiThieu, vl.MucToiDa;
GO

-- =============================================================================
-- 10. VIEW PHÂN QUYỀN - PHIẾU NHẬP XUẤT
-- =============================================================================

-- View Phiếu của Nhân viên (chỉ xem phiếu mình tạo)
CREATE VIEW vw_PhieuNhapXuat_NhanVien
AS
  SELECT
    pnx.Id,
    pnx.MaPhieu,
    pnx.LoaiPhieu,
    pnx.TaiKhoanId,
    tk.HoTen AS NguoiTao,
    pnx.NgayPhieu,
    pnx.NgayThucHien,
    kn.TenKho AS KhoNguon,
    kx.TenKho AS KhoNhap,
    pnx.LyDo,
    pnx.TrangThai,
    nd.HoTen AS NguoiDuyet,
    pnx.NgayDuyet,
    pnx.GhiChu,
    pnx.NgayTao,
    -- Tổng số vật liệu
    (SELECT COUNT(*)
    FROM ChiTietPhieuNhapXuat
    WHERE PhieuNhapXuatId = pnx.Id) AS SoVatLieu,
    -- Tổng giá trị
    (SELECT SUM(ThanhTien)
    FROM ChiTietPhieuNhapXuat
    WHERE PhieuNhapXuatId = pnx.Id) AS TongGiaTri
  FROM PhieuNhapXuat pnx
    INNER JOIN TaiKhoan tk ON pnx.TaiKhoanId = tk.Id
    LEFT JOIN Kho kn ON pnx.KhoNguonId = kn.Id
    LEFT JOIN Kho kx ON pnx.KhoNhapId = kx.Id
    LEFT JOIN TaiKhoan nd ON pnx.NguoiDuyet = nd.Id;
GO

-- =============================================================================
-- 11. STORED PROCEDURE: ĐĂNG NHẬP & TẠO PHIÊN LÀM VIỆC
-- =============================================================================
CREATE PROCEDURE sp_DangNhap
  @TenDangNhap NVARCHAR(50),
  @MatKhau NVARCHAR(255),
  -- Hash password
  @DiaChi_IP NVARCHAR(50) = NULL,
  @ThietBi NVARCHAR(200) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  -- Kiểm tra tài khoản
  DECLARE @TaiKhoanId INT;
  DECLARE @VaiTroMa NVARCHAR(20);
  DECLARE @TrangThai NVARCHAR(50);

  SELECT @TaiKhoanId = tk.Id,
    @VaiTroMa = vt.MaVaiTro,
    @TrangThai = tk.TrangThai
  FROM TaiKhoan tk
    INNER JOIN VaiTro vt ON tk.VaiTroId = vt.Id
  WHERE tk.TenDangNhap = @TenDangNhap
    AND tk.MatKhau = @MatKhau;

  IF @TaiKhoanId IS NULL
  BEGIN
    SELECT 0 AS Success, N'Sai tên đăng nhập hoặc mật khẩu' AS Message;
    RETURN;
  END

  IF @TrangThai <> N'Hoạt động'
  BEGIN
    SELECT 0 AS Success, N'Tài khoản đã bị khóa hoặc vô hiệu hóa' AS Message;
    RETURN;
  END

  -- Tạo phiên làm việc
  DECLARE @PhienLamViecId INT;

  INSERT INTO PhienLamViec
    (TaiKhoanId, DiaChi_IP, ThietBi, TrangThai)
  VALUES
    (@TaiKhoanId, @DiaChi_IP, @ThietBi, N'Đang hoạt động');

  SET @PhienLamViecId = SCOPE_IDENTITY();

  SELECT 1 AS Success,
    N'Đăng nhập thành công' AS Message,
    @TaiKhoanId AS TaiKhoanId,
    @PhienLamViecId AS PhienLamViecId,
    @VaiTroMa AS VaiTro;
END;
GO

-- =============================================================================
-- 12. STORED PROCEDURE: ĐĂNG XUẤT
-- =============================================================================
CREATE PROCEDURE sp_DangXuat
  @PhienLamViecId INT
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE PhienLamViec
    SET ThoiGianDangXuat = GETDATE(),
        TrangThai = N'Đã đăng xuất'
    WHERE Id = @PhienLamViecId;

  SELECT 1 AS Success, N'Đăng xuất thành công' AS Message;
END;
GO

-- =============================================================================
-- 13. STORED PROCEDURE: NHẬP KHO
-- =============================================================================
CREATE PROCEDURE sp_NhapKho
  @PhienLamViecId INT,
  @TaiKhoanId INT,
  @KhoNhapId INT,
  @NgayPhieu DATE,
  @LyDo NVARCHAR(500) = NULL,
  @NguoiGiaoHang NVARCHAR(200) = NULL,
  @DonViCungCap NVARCHAR(200) = NULL,
  @SoHoaDon NVARCHAR(100) = NULL,
  @GhiChu NVARCHAR(MAX) = NULL,
  @DanhSachVatLieu NVARCHAR(MAX)
-- JSON array: [{"VatLieuId":1,"SoLuong":10,"DonGia":50000,"ViTri":"A1"}]
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRANSACTION;

  BEGIN TRY
        -- Tạo mã phiếu
        DECLARE @MaPhieu NVARCHAR(50);
    DECLARE @Nam INT = YEAR(@NgayPhieu);
    DECLARE @SoThuTu INT;

    SELECT @SoThuTu = ISNULL(MAX(CAST(RIGHT(MaPhieu, 6) AS INT)), 0) + 1
  FROM PhieuNhapXuat
  WHERE YEAR(NgayPhieu) = @Nam
    AND LoaiPhieu = N'NHAP_KHO';

    SET @MaPhieu = N'PN' + CAST(@Nam AS NVARCHAR) + RIGHT('000000' + CAST(@SoThuTu AS NVARCHAR), 6);

    -- Tạo phiếu nhập
    DECLARE @PhieuId INT;

    INSERT INTO PhieuNhapXuat
    (MaPhieu, LoaiPhieu, PhienLamViecId, TaiKhoanId, NgayPhieu, NgayThucHien,
    KhoNhapId, LyDo, NguoiGiaoHang, DonViCungCap, SoHoaDon, GhiChu, TrangThai)
  VALUES
    (@MaPhieu, N'NHAP_KHO', @PhienLamViecId, @TaiKhoanId, @NgayPhieu, GETDATE(),
      @KhoNhapId, @LyDo, @NguoiGiaoHang, @DonViCungCap, @SoHoaDon, @GhiChu, N'Hoàn thành');

    SET @PhieuId = SCOPE_IDENTITY();

    -- Thêm chi tiết & cập nhật tồn kho từ JSON
    DECLARE @ChiTiet TABLE (
    VatLieuId INT,
    SoLuong DECIMAL(18,3),
    DonGia DECIMAL(18,2),
    ViTri NVARCHAR(100)
        );

    INSERT INTO @ChiTiet
  SELECT VatLieuId, SoLuong, DonGia, ViTri
  FROM OPENJSON(@DanhSachVatLieu)
            WITH (
                VatLieuId INT,
                SoLuong DECIMAL(18,3),
                DonGia DECIMAL(18,2),
                ViTri NVARCHAR(100)
            );

    -- Thêm chi tiết phiếu
    INSERT INTO ChiTietPhieuNhapXuat
    (PhieuNhapXuatId, VatLieuId, SoLuong, DonGia, ViTri)
  SELECT @PhieuId, VatLieuId, SoLuong, DonGia, ViTri
  FROM @ChiTiet;

    -- Cập nhật tồn kho
    DECLARE @VatLieuId INT, @SoLuong DECIMAL(18,3), @ViTri NVARCHAR(100);
    DECLARE cur CURSOR FOR 
        SELECT VatLieuId, SoLuong, ViTri
  FROM @ChiTiet;

    OPEN cur;
    FETCH NEXT FROM cur INTO @VatLieuId, @SoLuong, @ViTri;

    WHILE @@FETCH_STATUS = 0
        BEGIN
    DECLARE @SoLuongTruoc DECIMAL(18,3) = 0;
    DECLARE @SoLuongSau DECIMAL(18,3);

    -- Lấy số lượng trước
    SELECT @SoLuongTruoc = ISNULL(SoLuongTon, 0)
    FROM TonKho
    WHERE VatLieuId = @VatLieuId
      AND KhoId = @KhoNhapId;

    SET @SoLuongSau = @SoLuongTruoc + @SoLuong;

    -- Upsert tồn kho
    IF EXISTS (SELECT 1
    FROM TonKho
    WHERE VatLieuId = @VatLieuId
      AND KhoId = @KhoNhapId)
            BEGIN
      UPDATE TonKho
                SET SoLuongTon = SoLuongTon + @SoLuong,
                    ViTri = ISNULL(@ViTri, ViTri),
                    NgayCapNhat = GETDATE()
                WHERE VatLieuId = @VatLieuId
        AND KhoId = @KhoNhapId;
    END
            ELSE
            BEGIN
      INSERT INTO TonKho
        (VatLieuId, KhoId, SoLuongTon, ViTri)
      VALUES
        (@VatLieuId, @KhoNhapId, @SoLuong, @ViTri);
    END

    -- Ghi log lịch sử
    INSERT INTO LichSuVatLieu
      (VatLieuId, KhoId, PhieuNhapXuatId, PhienLamViecId, TaiKhoanId,
      LoaiThayDoi, SoLuongTruoc, SoLuongThayDoi, SoLuongSau, LyDo)
    VALUES
      (@VatLieuId, @KhoNhapId, @PhieuId, @PhienLamViecId, @TaiKhoanId,
        N'NHAP', @SoLuongTruoc, @SoLuong, @SoLuongSau, @LyDo);

    FETCH NEXT FROM cur INTO @VatLieuId, @SoLuong, @ViTri;
  END

    CLOSE cur;
    DEALLOCATE cur;

    COMMIT TRANSACTION;
    SELECT 1 AS Success, @MaPhieu AS MaPhieu, N'Nhập kho thành công' AS Message;
  END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
    SELECT 0 AS Success, ERROR_MESSAGE() AS Message;
  END CATCH
END;
GO

-- =============================================================================
-- 14. STORED PROCEDURE: XUẤT KHO
-- =============================================================================
CREATE PROCEDURE sp_XuatKho
  @PhienLamViecId INT,
  @TaiKhoanId INT,
  @KhoXuatId INT,
  @NgayPhieu DATE,
  @LyDo NVARCHAR(500) = NULL,
  @NguoiNhanHang NVARCHAR(200) = NULL,
  @DonViNhan NVARCHAR(200) = NULL,
  @GhiChu NVARCHAR(MAX) = NULL,
  @DanhSachVatLieu NVARCHAR(MAX)
-- JSON array
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRANSACTION;

  BEGIN TRY
        -- Tạo mã phiếu
        DECLARE @MaPhieu NVARCHAR(50);
    DECLARE @Nam INT = YEAR(@NgayPhieu);
    DECLARE @SoThuTu INT;

    SELECT @SoThuTu = ISNULL(MAX(CAST(RIGHT(MaPhieu, 6) AS INT)), 0) + 1
  FROM PhieuNhapXuat
  WHERE YEAR(NgayPhieu) = @Nam
    AND LoaiPhieu = N'XUAT_KHO';

    SET @MaPhieu = N'PX' + CAST(@Nam AS NVARCHAR) + RIGHT('000000' + CAST(@SoThuTu AS NVARCHAR), 6);

    -- Tạo phiếu xuất
    DECLARE @PhieuId INT;

    INSERT INTO PhieuNhapXuat
    (MaPhieu, LoaiPhieu, PhienLamViecId, TaiKhoanId, NgayPhieu, NgayThucHien,
    KhoNguonId, LyDo, NguoiNhanHang, DonViNhan, GhiChu, TrangThai)
  VALUES
    (@MaPhieu, N'XUAT_KHO', @PhienLamViecId, @TaiKhoanId, @NgayPhieu, GETDATE(),
      @KhoXuatId, @LyDo, @NguoiNhanHang, @DonViNhan, @GhiChu, N'Hoàn thành');

    SET @PhieuId = SCOPE_IDENTITY();

    -- Parse JSON
    DECLARE @ChiTiet TABLE (
    VatLieuId INT,
    SoLuong DECIMAL(18,3)
        );

    INSERT INTO @ChiTiet
  SELECT VatLieuId, SoLuong
  FROM OPENJSON(@DanhSachVatLieu)
            WITH (VatLieuId INT, SoLuong DECIMAL(18,3));

    -- Kiểm tra tồn kho đủ không
    IF EXISTS (
            SELECT 1
  FROM @ChiTiet ct
    LEFT JOIN TonKho tk ON ct.VatLieuId = tk.VatLieuId
      AND tk.KhoId = @KhoXuatId
  WHERE ISNULL(tk.SoLuongKhaDung, 0) < ct.SoLuong
        )
        BEGIN
    ROLLBACK TRANSACTION;
    SELECT 0 AS Success, N'Số lượng tồn kho không đủ' AS Message;
    RETURN;
  END

    -- Thêm chi tiết
    INSERT INTO ChiTietPhieuNhapXuat
    (PhieuNhapXuatId, VatLieuId, SoLuong)
  SELECT @PhieuId, VatLieuId, SoLuong
  FROM @ChiTiet;

    -- Cập nhật tồn kho và log
    DECLARE @VatLieuId INT, @SoLuong DECIMAL(18,3);
    DECLARE cur CURSOR FOR 
        SELECT VatLieuId, SoLuong
  FROM @ChiTiet;

    OPEN cur;
    FETCH NEXT FROM cur INTO @VatLieuId, @SoLuong;

    WHILE @@FETCH_STATUS = 0
        BEGIN
    DECLARE @SoLuongTruoc DECIMAL(18,3);
    DECLARE @SoLuongSau DECIMAL(18,3);

    SELECT @SoLuongTruoc = SoLuongTon
    FROM TonKho
    WHERE VatLieuId = @VatLieuId
      AND KhoId = @KhoXuatId;

    SET @SoLuongSau = @SoLuongTruoc - @SoLuong;

    UPDATE TonKho
            SET SoLuongTon = SoLuongTon - @SoLuong,
                NgayCapNhat = GETDATE()
            WHERE VatLieuId = @VatLieuId
      AND KhoId = @KhoXuatId;

    -- Log lịch sử
    INSERT INTO LichSuVatLieu
      (VatLieuId, KhoId, PhieuNhapXuatId, PhienLamViecId, TaiKhoanId,
      LoaiThayDoi, SoLuongTruoc, SoLuongThayDoi, SoLuongSau, LyDo)
    VALUES
      (@VatLieuId, @KhoXuatId, @PhieuId, @PhienLamViecId, @TaiKhoanId,
        N'XUAT', @SoLuongTruoc, -@SoLuong, @SoLuongSau, @LyDo);

    FETCH NEXT FROM cur INTO @VatLieuId, @SoLuong;
  END

    CLOSE cur;
    DEALLOCATE cur;

    COMMIT TRANSACTION;
    SELECT 1 AS Success, @MaPhieu AS MaPhieu, N'Xuất kho thành công' AS Message;
  END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
    SELECT 0 AS Success, ERROR_MESSAGE() AS Message;
  END CATCH
END;
GO

-- =============================================================================
-- 15. STORED PROCEDURE: LẤY LỊCH SỬ PHIÊN LÀM VIỆC
-- =============================================================================
CREATE PROCEDURE sp_LayLichSuPhienLamViec
  @TaiKhoanId INT = NULL,
  -- NULL = Tất cả (chỉ Admin)
  @TuNgay DATE = NULL,
  @DenNgay DATE = NULL
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    plv.Id AS PhienLamViecId,
    tk.TenDangNhap,
    tk.HoTen,
    vt.TenVaiTro,
    plv.ThoiGianDangNhap,
    plv.ThoiGianDangXuat,
    DATEDIFF(MINUTE, plv.ThoiGianDangNhap, ISNULL(plv.ThoiGianDangXuat, GETDATE())) AS ThoiGianLamViec_Phut,
    plv.DiaChi_IP,
    plv.ThietBi,
    plv.TrangThai,
    -- Số phiếu tạo trong phiên
    (SELECT COUNT(*)
    FROM PhieuNhapXuat
    WHERE PhienLamViecId = plv.Id) AS SoPhieuTao,
    -- Số thay đổi vật liệu
    (SELECT COUNT(*)
    FROM LichSuVatLieu
    WHERE PhienLamViecId = plv.Id) AS SoThayDoi
  FROM PhienLamViec plv
    INNER JOIN TaiKhoan tk ON plv.TaiKhoanId = tk.Id
    INNER JOIN VaiTro vt ON tk.VaiTroId = vt.Id
  WHERE (@TaiKhoanId IS NULL OR plv.TaiKhoanId = @TaiKhoanId)
    AND (@TuNgay IS NULL OR CAST(plv.ThoiGianDangNhap AS DATE) >= @TuNgay)
    AND (@DenNgay IS NULL OR CAST(plv.ThoiGianDangNhap AS DATE) <= @DenNgay)
  ORDER BY plv.ThoiGianDangNhap DESC;
END;
GO

-- =============================================================================
-- 16. STORED PROCEDURE: CHUYỂN KHO (KHO MẸ → KHO CON hoặc KHO CON → KHO MẸ)
-- =============================================================================
CREATE PROCEDURE sp_ChuyenKho
  @PhienLamViecId INT,
  @TaiKhoanId INT,
  @KhoNguonId INT,
  -- Kho xuất
  @KhoNhapId INT,
  -- Kho nhập
  @NgayPhieu DATE,
  @LyDo NVARCHAR(500) = NULL,
  @GhiChu NVARCHAR(MAX) = NULL,
  @DanhSachVatLieu NVARCHAR(MAX)
-- JSON array: [{"VatLieuId":1,"SoLuong":10,"ViTriNguon":"A1","ViTriNhap":"B2"}]
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRANSACTION;

  BEGIN TRY
        -- Validate kho nguồn và kho nhập khác nhau
        IF @KhoNguonId = @KhoNhapId
        BEGIN
    ROLLBACK TRANSACTION;
    SELECT 0 AS Success, N'Kho nguồn và kho nhập phải khác nhau' AS Message;
    RETURN;
  END

    -- Tạo mã phiếu chuyển kho
    DECLARE @MaPhieu NVARCHAR(50);
    DECLARE @Nam INT = YEAR(@NgayPhieu);
    DECLARE @SoThuTu INT;

    SELECT @SoThuTu = ISNULL(MAX(CAST(RIGHT(MaPhieu, 6) AS INT)), 0) + 1
  FROM PhieuNhapXuat
  WHERE YEAR(NgayPhieu) = @Nam
    AND LoaiPhieu = N'CHUYEN_KHO';

    SET @MaPhieu = N'PCK' + CAST(@Nam AS NVARCHAR) + RIGHT('000000' + CAST(@SoThuTu AS NVARCHAR), 6);

    -- Lấy thông tin kho
    DECLARE @TenKhoNguon NVARCHAR(200), @TenKhoNhap NVARCHAR(200);
    SELECT @TenKhoNguon = TenKho
  FROM Kho
  WHERE Id = @KhoNguonId;
    SELECT @TenKhoNhap = TenKho
  FROM Kho
  WHERE Id = @KhoNhapId;

    -- Tạo phiếu chuyển kho
    DECLARE @PhieuId INT;

    INSERT INTO PhieuNhapXuat
    (MaPhieu, LoaiPhieu, PhienLamViecId, TaiKhoanId, NgayPhieu, NgayThucHien,
    KhoNguonId, KhoNhapId, LyDo, GhiChu, TrangThai)
  VALUES
    (@MaPhieu, N'CHUYEN_KHO', @PhienLamViecId, @TaiKhoanId, @NgayPhieu, GETDATE(),
      @KhoNguonId, @KhoNhapId, @LyDo, @GhiChu, N'Hoàn thành');

    SET @PhieuId = SCOPE_IDENTITY();

    -- Parse JSON
    DECLARE @ChiTiet TABLE (
    VatLieuId INT,
    SoLuong DECIMAL(18,3),
    ViTriNguon NVARCHAR(100),
    ViTriNhap NVARCHAR(100)
        );

    INSERT INTO @ChiTiet
  SELECT VatLieuId, SoLuong, ViTriNguon, ViTriNhap
  FROM OPENJSON(@DanhSachVatLieu)
            WITH (
                VatLieuId INT,
                SoLuong DECIMAL(18,3),
                ViTriNguon NVARCHAR(100),
                ViTriNhap NVARCHAR(100)
            );

    -- Kiểm tra tồn kho nguồn đủ không
    IF EXISTS (
            SELECT 1
  FROM @ChiTiet ct
    LEFT JOIN TonKho tk ON ct.VatLieuId = tk.VatLieuId
      AND tk.KhoId = @KhoNguonId
  WHERE ISNULL(tk.SoLuongKhaDung, 0) < ct.SoLuong
        )
        BEGIN
    ROLLBACK TRANSACTION;
    SELECT 0 AS Success, N'Số lượng tồn kho nguồn không đủ để chuyển' AS Message;
    RETURN;
  END

    -- Thêm chi tiết phiếu
    INSERT INTO ChiTietPhieuNhapXuat
    (PhieuNhapXuatId, VatLieuId, SoLuong, ViTri, GhiChu)
  SELECT @PhieuId, VatLieuId, SoLuong, ViTriNhap,
    N'Chuyển từ ' + @TenKhoNguon + N' (' + ISNULL(ViTriNguon, N'') + N')'
  FROM @ChiTiet;

    -- Xử lý chuyển kho
    DECLARE @VatLieuId INT, @SoLuong DECIMAL(18,3), @ViTriNguon NVARCHAR(100), @ViTriNhap NVARCHAR(100);
    DECLARE cur CURSOR FOR 
        SELECT VatLieuId, SoLuong, ViTriNguon, ViTriNhap
  FROM @ChiTiet;

    OPEN cur;
    FETCH NEXT FROM cur INTO @VatLieuId, @SoLuong, @ViTriNguon, @ViTriNhap;

    WHILE @@FETCH_STATUS = 0
        BEGIN
    DECLARE @SoLuongTruocNguon DECIMAL(18,3);
    DECLARE @SoLuongSauNguon DECIMAL(18,3);
    DECLARE @SoLuongTruocNhap DECIMAL(18,3) = 0;
    DECLARE @SoLuongSauNhap DECIMAL(18,3);

    -- 1. Trừ tồn kho nguồn
    SELECT @SoLuongTruocNguon = SoLuongTon
    FROM TonKho
    WHERE VatLieuId = @VatLieuId
      AND KhoId = @KhoNguonId;

    SET @SoLuongSauNguon = @SoLuongTruocNguon - @SoLuong;

    UPDATE TonKho
            SET SoLuongTon = SoLuongTon - @SoLuong,
                NgayCapNhat = GETDATE()
            WHERE VatLieuId = @VatLieuId
      AND KhoId = @KhoNguonId;

    -- Log xuất từ kho nguồn
    INSERT INTO LichSuVatLieu
      (VatLieuId, KhoId, PhieuNhapXuatId, PhienLamViecId, TaiKhoanId,
      LoaiThayDoi, SoLuongTruoc, SoLuongThayDoi, SoLuongSau, KhoLienQuanId, LyDo, GhiChu)
    VALUES
      (@VatLieuId, @KhoNguonId, @PhieuId, @PhienLamViecId, @TaiKhoanId,
        N'CHUYEN_DI', @SoLuongTruocNguon, -@SoLuong, @SoLuongSauNguon, @KhoNhapId,
        @LyDo, N'Chuyển đến: ' + @TenKhoNhap);

    -- 2. Cộng tồn kho nhập
    SELECT @SoLuongTruocNhap = ISNULL(SoLuongTon, 0)
    FROM TonKho
    WHERE VatLieuId = @VatLieuId
      AND KhoId = @KhoNhapId;

    SET @SoLuongSauNhap = @SoLuongTruocNhap + @SoLuong;

    -- Upsert tồn kho nhập
    IF EXISTS (SELECT 1
    FROM TonKho
    WHERE VatLieuId = @VatLieuId
      AND KhoId = @KhoNhapId)
            BEGIN
      UPDATE TonKho
                SET SoLuongTon = SoLuongTon + @SoLuong,
                    ViTri = ISNULL(@ViTriNhap, ViTri),
                    NgayCapNhat = GETDATE()
                WHERE VatLieuId = @VatLieuId
        AND KhoId = @KhoNhapId;
    END
            ELSE
            BEGIN
      INSERT INTO TonKho
        (VatLieuId, KhoId, SoLuongTon, ViTri)
      VALUES
        (@VatLieuId, @KhoNhapId, @SoLuong, @ViTriNhap);
    END

    -- Log nhập vào kho đích
    INSERT INTO LichSuVatLieu
      (VatLieuId, KhoId, PhieuNhapXuatId, PhienLamViecId, TaiKhoanId,
      LoaiThayDoi, SoLuongTruoc, SoLuongThayDoi, SoLuongSau, KhoLienQuanId, LyDo, GhiChu)
    VALUES
      (@VatLieuId, @KhoNhapId, @PhieuId, @PhienLamViecId, @TaiKhoanId,
        N'CHUYEN_DEN', @SoLuongTruocNhap, @SoLuong, @SoLuongSauNhap, @KhoNguonId,
        @LyDo, N'Chuyển từ: ' + @TenKhoNguon);

    FETCH NEXT FROM cur INTO @VatLieuId, @SoLuong, @ViTriNguon, @ViTriNhap;
  END

    CLOSE cur;
    DEALLOCATE cur;

    COMMIT TRANSACTION;
    SELECT 1 AS Success,
    @MaPhieu AS MaPhieu,
    N'Chuyển kho thành công từ ' + @TenKhoNguon + N' sang ' + @TenKhoNhap AS Message;
  END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
    SELECT 0 AS Success, ERROR_MESSAGE() AS Message;
  END CATCH
END;
GO

-- =============================================================================
-- 17. VIEW BÁO CÁO PHÂN QUYỀN: PHIẾU THEO VAI TRÒ
-- =============================================================================

-- View: Nhân viên chỉ xem phiếu của mình
CREATE VIEW vw_BaoCao_PhieuTheoNhanVien
AS
  SELECT
    pnx.Id,
    pnx.MaPhieu,
    pnx.LoaiPhieu,
    CASE pnx.LoaiPhieu
        WHEN N'NHAP_KHO' THEN N'Nhập kho'
        WHEN N'XUAT_KHO' THEN N'Xuất kho'
        WHEN N'CHUYEN_KHO' THEN N'Chuyển kho'
        WHEN N'KIEM_KE' THEN N'Kiểm kê'
        WHEN N'DIEU_CHINH' THEN N'Điều chỉnh'
        ELSE pnx.LoaiPhieu
    END AS TenLoaiPhieu,
    pnx.TaiKhoanId,
    tk.HoTen AS NguoiTao,
    tk.TenDangNhap,
    vt.TenVaiTro,
    pnx.NgayPhieu,
    pnx.NgayThucHien,
    kn.MaKho AS MaKhoNguon,
    kn.TenKho AS TenKhoNguon,
    kx.MaKho AS MaKhoNhap,
    kx.TenKho AS TenKhoNhap,
    pnx.LyDo,
    pnx.TrangThai,
    nd.HoTen AS NguoiDuyet,
    pnx.NgayDuyet,
    pnx.PhienLamViecId,
    plv.ThoiGianDangNhap,
    plv.ThoiGianDangXuat,
    -- Chi tiết số lượng
    (SELECT COUNT(*)
    FROM ChiTietPhieuNhapXuat
    WHERE PhieuNhapXuatId = pnx.Id) AS SoLoaiVatLieu,
    (SELECT SUM(SoLuong)
    FROM ChiTietPhieuNhapXuat
    WHERE PhieuNhapXuatId = pnx.Id) AS TongSoLuong,
    (SELECT SUM(ThanhTien)
    FROM ChiTietPhieuNhapXuat
    WHERE PhieuNhapXuatId = pnx.Id) AS TongGiaTri
  FROM PhieuNhapXuat pnx
    INNER JOIN TaiKhoan tk ON pnx.TaiKhoanId = tk.Id
    INNER JOIN VaiTro vt ON tk.VaiTroId = vt.Id
    INNER JOIN PhienLamViec plv ON pnx.PhienLamViecId = plv.Id
    LEFT JOIN Kho kn ON pnx.KhoNguonId = kn.Id
    LEFT JOIN Kho kx ON pnx.KhoNhapId = kx.Id
    LEFT JOIN TaiKhoan nd ON pnx.NguoiDuyet = nd.Id;
GO

-- View: Nhân viên và Admin xem tất cả phiếu + thống kê
CREATE VIEW vw_BaoCao_TatCaPhieu
AS
  SELECT
    pnx.Id,
    pnx.MaPhieu,
    pnx.LoaiPhieu,
    CASE pnx.LoaiPhieu
        WHEN N'NHAP_KHO' THEN N'Nhập kho'
        WHEN N'XUAT_KHO' THEN N'Xuất kho'
        WHEN N'CHUYEN_KHO' THEN N'Chuyển kho'
        WHEN N'KIEM_KE' THEN N'Kiểm kê'
        WHEN N'DIEU_CHINH' THEN N'Điều chỉnh'
        ELSE pnx.LoaiPhieu
    END AS TenLoaiPhieu,
    pnx.TaiKhoanId,
    tk.HoTen AS NguoiTao,
    tk.TenDangNhap,
    vt.TenVaiTro AS VaiTroNguoiTao,
    pnx.NgayPhieu,
    pnx.NgayThucHien,
    YEAR(pnx.NgayPhieu) AS Nam,
    MONTH(pnx.NgayPhieu) AS Thang,
    kn.MaKho AS MaKhoNguon,
    kn.TenKho AS TenKhoNguon,
    kn.LoaiKho AS LoaiKhoNguon,
    kx.MaKho AS MaKhoNhap,
    kx.TenKho AS TenKhoNhap,
    kx.LoaiKho AS LoaiKhoNhap,
    pnx.DonViCungCap,
    pnx.NguoiGiaoHang,
    pnx.DonViNhan,
    pnx.NguoiNhanHang,
    pnx.LyDo,
    pnx.TrangThai,
    nd.HoTen AS NguoiDuyet,
    pnx.NgayDuyet,
    pnx.PhienLamViecId,
    plv.ThoiGianDangNhap,
    plv.ThoiGianDangXuat,
    DATEDIFF(MINUTE, plv.ThoiGianDangNhap, ISNULL(plv.ThoiGianDangXuat, GETDATE())) AS ThoiGianPhien_Phut,
    -- Chi tiết thống kê
    (SELECT COUNT(*)
    FROM ChiTietPhieuNhapXuat
    WHERE PhieuNhapXuatId = pnx.Id) AS SoLoaiVatLieu,
    (SELECT SUM(SoLuong)
    FROM ChiTietPhieuNhapXuat
    WHERE PhieuNhapXuatId = pnx.Id) AS TongSoLuong,
    (SELECT SUM(ThanhTien)
    FROM ChiTietPhieuNhapXuat
    WHERE PhieuNhapXuatId = pnx.Id) AS TongGiaTri
  FROM PhieuNhapXuat pnx
    INNER JOIN TaiKhoan tk ON pnx.TaiKhoanId = tk.Id
    INNER JOIN VaiTro vt ON tk.VaiTroId = vt.Id
    INNER JOIN PhienLamViec plv ON pnx.PhienLamViecId = plv.Id
    LEFT JOIN Kho kn ON pnx.KhoNguonId = kn.Id
    LEFT JOIN Kho kx ON pnx.KhoNhapId = kx.Id
    LEFT JOIN TaiKhoan nd ON pnx.NguoiDuyet = nd.Id;
GO

-- =============================================================================
-- 18. STORED PROCEDURE: XEM PHIẾU THEO PHÂN QUYỀN
-- =============================================================================
CREATE PROCEDURE sp_XemPhieu_TheoQuyen
  @TaiKhoanId INT,
  @VaiTroMa NVARCHAR(20),
  -- 'ADMIN', 'NHAN_VIEN'
  @LoaiPhieu NVARCHAR(20) = NULL,
  -- Lọc loại phiếu
  @TuNgay DATE = NULL,
  @DenNgay DATE = NULL,
  @TrangThai NVARCHAR(50) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  IF @VaiTroMa IN (N'NHAN_VIEN', N'ADMIN')
    BEGIN
    -- Nhân viên và Admin xem tất cả
    SELECT *
    FROM vw_BaoCao_TatCaPhieu
    WHERE (@LoaiPhieu IS NULL OR LoaiPhieu = @LoaiPhieu)
      AND (@TuNgay IS NULL OR NgayPhieu >= @TuNgay)
      AND (@DenNgay IS NULL OR NgayPhieu <= @DenNgay)
      AND (@TrangThai IS NULL OR TrangThai = @TrangThai)
    ORDER BY NgayPhieu DESC, MaPhieu DESC;
  END
  ELSE
    BEGIN
    SELECT 0 AS Success, N'Vai trò không hợp lệ' AS Message;
  END
END;
GO

-- =============================================================================
-- 19. STORED PROCEDURE: BÁO CÁO LỊCH SỬ VẬT LIỆU THEO PHÂN QUYỀN
-- =============================================================================
CREATE PROCEDURE sp_BaoCao_LichSuVatLieu
  @TaiKhoanId INT,
  @VaiTroMa NVARCHAR(20),
  @VatLieuId INT = NULL,
  -- Lọc theo vật liệu
  @KhoId INT = NULL,
  -- Lọc theo kho
  @TuNgay DATE = NULL,
  @DenNgay DATE = NULL
AS
BEGIN
  SET NOCOUNT ON;

  IF @VaiTroMa IN (N'NHAN_VIEN', N'ADMIN')
    BEGIN
    -- Nhân viên và Admin xem tất cả lịch sử
    SELECT
      ls.Id,
      ls.ThoiGian,
      vl.MaVatLieu,
      vl.TenVatLieu,
      nh.TenNhom AS NhomVatLieu,
      k.MaKho,
      k.TenKho,
      k.LoaiKho,
      ls.LoaiThayDoi,
      CASE ls.LoaiThayDoi
            WHEN N'NHAP' THEN N'Nhập kho'
            WHEN N'XUAT' THEN N'Xuất kho'
            WHEN N'CHUYEN_DI' THEN N'Chuyển đi'
            WHEN N'CHUYEN_DEN' THEN N'Chuyển đến'
            WHEN N'DIEU_CHINH' THEN N'Điều chỉnh'
            WHEN N'KIEM_KE' THEN N'Kiểm kê'
            ELSE ls.LoaiThayDoi
        END AS TenLoaiThayDoi,
      ls.SoLuongTruoc,
      ls.SoLuongThayDoi,
      ls.SoLuongSau,
      kq.TenKho AS KhoLienQuan,
      pnx.MaPhieu,
      tk.HoTen AS NguoiThucHien,
      tk.TenDangNhap,
      vt.TenVaiTro,
      ls.LyDo,
      ls.GhiChu
    FROM LichSuVatLieu ls
      INNER JOIN VatLieu vl ON ls.VatLieuId = vl.Id
      LEFT JOIN NhomVatLieu nh ON vl.NhomVatLieuId = nh.Id
      INNER JOIN Kho k ON ls.KhoId = k.Id
      LEFT JOIN Kho kq ON ls.KhoLienQuanId = kq.Id
      LEFT JOIN PhieuNhapXuat pnx ON ls.PhieuNhapXuatId = pnx.Id
      INNER JOIN TaiKhoan tk ON ls.TaiKhoanId = tk.Id
      INNER JOIN VaiTro vt ON tk.VaiTroId = vt.Id
    WHERE (@VatLieuId IS NULL OR ls.VatLieuId = @VatLieuId)
      AND (@KhoId IS NULL OR ls.KhoId = @KhoId)
      AND (@TuNgay IS NULL OR CAST(ls.ThoiGian AS DATE) >= @TuNgay)
      AND (@DenNgay IS NULL OR CAST(ls.ThoiGian AS DATE) <= @DenNgay)
    ORDER BY ls.ThoiGian DESC;
  END
END;
GO

-- =============================================================================
-- 20. STORED PROCEDURE: BÁO CÁO HOẠT ĐỘNG THEO PHIÊN LÀM VIỆC
-- =============================================================================
CREATE PROCEDURE sp_BaoCao_HoatDongTheoPhien
  @PhienLamViecId INT
AS
BEGIN
  SET NOCOUNT ON;

  -- Thông tin phiên
  SELECT
    plv.Id AS PhienLamViecId,
    tk.TenDangNhap,
    tk.HoTen,
    vt.TenVaiTro,
    plv.ThoiGianDangNhap,
    plv.ThoiGianDangXuat,
    DATEDIFF(MINUTE, plv.ThoiGianDangNhap, ISNULL(plv.ThoiGianDangXuat, GETDATE())) AS ThoiGianLamViec_Phut,
    plv.DiaChi_IP,
    plv.ThietBi,
    plv.TrangThai
  FROM PhienLamViec plv
    INNER JOIN TaiKhoan tk ON plv.TaiKhoanId = tk.Id
    INNER JOIN VaiTro vt ON tk.VaiTroId = vt.Id
  WHERE plv.Id = @PhienLamViecId;

  -- Danh sách phiếu tạo trong phiên
  SELECT
    pnx.MaPhieu,
    pnx.LoaiPhieu,
    CASE pnx.LoaiPhieu
        WHEN N'NHAP_KHO' THEN N'Nhập kho'
        WHEN N'XUAT_KHO' THEN N'Xuất kho'
        WHEN N'CHUYEN_KHO' THEN N'Chuyển kho'
        WHEN N'KIEM_KE' THEN N'Kiểm kê'
        WHEN N'DIEU_CHINH' THEN N'Điều chỉnh'
        ELSE pnx.LoaiPhieu
    END AS TenLoaiPhieu,
    pnx.NgayPhieu,
    pnx.NgayThucHien,
    kn.TenKho AS KhoNguon,
    kx.TenKho AS KhoNhap,
    pnx.TrangThai,
    (SELECT COUNT(*)
    FROM ChiTietPhieuNhapXuat
    WHERE PhieuNhapXuatId = pnx.Id) AS SoVatLieu,
    (SELECT SUM(SoLuong)
    FROM ChiTietPhieuNhapXuat
    WHERE PhieuNhapXuatId = pnx.Id) AS TongSoLuong
  FROM PhieuNhapXuat pnx
    LEFT JOIN Kho kn ON pnx.KhoNguonId = kn.Id
    LEFT JOIN Kho kx ON pnx.KhoNhapId = kx.Id
  WHERE pnx.PhienLamViecId = @PhienLamViecId
  ORDER BY pnx.NgayThucHien;

  -- Lịch sử thay đổi vật liệu trong phiên
  SELECT
    ls.ThoiGian,
    vl.MaVatLieu,
    vl.TenVatLieu,
    k.TenKho,
    ls.LoaiThayDoi,
    ls.SoLuongTruoc,
    ls.SoLuongThayDoi,
    ls.SoLuongSau,
    pnx.MaPhieu,
    ls.LyDo
  FROM LichSuVatLieu ls
    INNER JOIN VatLieu vl ON ls.VatLieuId = vl.Id
    INNER JOIN Kho k ON ls.KhoId = k.Id
    LEFT JOIN PhieuNhapXuat pnx ON ls.PhieuNhapXuatId = pnx.Id
  WHERE ls.PhienLamViecId = @PhienLamViecId
  ORDER BY ls.ThoiGian;
END;
GO

-- =============================================================================
-- 21. STORED PROCEDURE: QUẢN LÝ TÀI KHOẢN (ADMIN ONLY)
-- =============================================================================

-- Tạo tài khoản mới
CREATE PROCEDURE sp_TaoTaiKhoan
  @TaiKhoanAdmin INT,
  -- Admin thực hiện
  @TenDangNhap NVARCHAR(50),
  @MatKhau NVARCHAR(255),
  @HoTen NVARCHAR(200),
  @Email NVARCHAR(200) = NULL,
  @SoDienThoai NVARCHAR(20) = NULL,
  @VaiTroId INT
AS
BEGIN
  SET NOCOUNT ON;

  -- Kiểm tra quyền Admin
  DECLARE @VaiTro NVARCHAR(20);
  SELECT @VaiTro = vt.MaVaiTro
  FROM TaiKhoan tk
    INNER JOIN VaiTro vt ON tk.VaiTroId = vt.Id
  WHERE tk.Id = @TaiKhoanAdmin;

  IF @VaiTro <> N'ADMIN'
    BEGIN
    SELECT 0 AS Success, N'Chỉ Admin mới có quyền tạo tài khoản' AS Message;
    RETURN;
  END

  -- Kiểm tra tên đăng nhập đã tồn tại
  IF EXISTS (SELECT 1
  FROM TaiKhoan
  WHERE TenDangNhap = @TenDangNhap)
    BEGIN
    SELECT 0 AS Success, N'Tên đăng nhập đã tồn tại' AS Message;
    RETURN;
  END

  -- Tạo tài khoản
  INSERT INTO TaiKhoan
    (TenDangNhap, MatKhau, HoTen, Email, SoDienThoai, VaiTroId, NguoiTao, TrangThai)
  VALUES
    (@TenDangNhap, @MatKhau, @HoTen, @Email, @SoDienThoai, @VaiTroId, @TaiKhoanAdmin, N'Hoạt động');

  DECLARE @TaiKhoanId INT = SCOPE_IDENTITY();

  SELECT 1 AS Success,
    @TaiKhoanId AS TaiKhoanId,
    N'Tạo tài khoản thành công' AS Message;
END;
GO

-- Phân quyền / Thay đổi vai trò
CREATE PROCEDURE sp_ThayDoiVaiTro
  @TaiKhoanAdmin INT,
  @TaiKhoanId INT,
  -- Tài khoản cần thay đổi
  @VaiTroMoi INT
AS
BEGIN
  SET NOCOUNT ON;

  -- Kiểm tra quyền Admin
  DECLARE @VaiTro NVARCHAR(20);
  SELECT @VaiTro = vt.MaVaiTro
  FROM TaiKhoan tk
    INNER JOIN VaiTro vt ON tk.VaiTroId = vt.Id
  WHERE tk.Id = @TaiKhoanAdmin;

  IF @VaiTro <> N'ADMIN'
    BEGIN
    SELECT 0 AS Success, N'Chỉ Admin mới có quyền phân quyền' AS Message;
    RETURN;
  END

  -- Không cho phép tự thay đổi vai trò mình
  IF @TaiKhoanAdmin = @TaiKhoanId
    BEGIN
    SELECT 0 AS Success, N'Không thể tự thay đổi vai trò của chính mình' AS Message;
    RETURN;
  END

  -- Cập nhật vai trò
  UPDATE TaiKhoan
    SET VaiTroId = @VaiTroMoi,
        NgayCapNhat = GETDATE()
    WHERE Id = @TaiKhoanId;

  DECLARE @TenVaiTroMoi NVARCHAR(100);
  SELECT @TenVaiTroMoi = TenVaiTro
  FROM VaiTro
  WHERE Id = @VaiTroMoi;

  SELECT 1 AS Success,
    N'Thay đổi vai trò thành công sang: ' + @TenVaiTroMoi AS Message;
END;
GO

-- Khóa / Mở khóa tài khoản
CREATE PROCEDURE sp_KhoaTaiKhoan
  @TaiKhoanAdmin INT,
  @TaiKhoanId INT,
  @TrangThai NVARCHAR(50)
-- 'Hoạt động', 'Tạm khóa', 'Đã xóa'
AS
BEGIN
  SET NOCOUNT ON;

  -- Kiểm tra quyền Admin
  DECLARE @VaiTro NVARCHAR(20);
  SELECT @VaiTro = vt.MaVaiTro
  FROM TaiKhoan tk
    INNER JOIN VaiTro vt ON tk.VaiTroId = vt.Id
  WHERE tk.Id = @TaiKhoanAdmin;

  IF @VaiTro <> N'ADMIN'
    BEGIN
    SELECT 0 AS Success, N'Chỉ Admin mới có quyền khóa/mở tài khoản' AS Message;
    RETURN;
  END

  -- Không cho phép tự khóa tài khoản mình
  IF @TaiKhoanAdmin = @TaiKhoanId
    BEGIN
    SELECT 0 AS Success, N'Không thể tự khóa tài khoản của chính mình' AS Message;
    RETURN;
  END

  -- Cập nhật trạng thái
  UPDATE TaiKhoan
    SET TrangThai = @TrangThai,
        NgayCapNhat = GETDATE()
    WHERE Id = @TaiKhoanId;

  SELECT 1 AS Success,
    N'Cập nhật trạng thái tài khoản thành: ' + @TrangThai AS Message;
END;
GO

-- =============================================================================
-- KẾT THÚC MODULE QUẢN LÝ KHO MỞ RỘNG
-- =============================================================================
PRINT N'';
PRINT N'=================================================================';
PRINT N'Module Quản lý Kho đã được tạo thành công!';
PRINT N'=================================================================';
PRINT N'';
PRINT N'TÍNH NĂNG CHÍNH:';
PRINT N'1. Phân quyền 2 cấp: Admin, Nhân viên';
PRINT N'2. Kho Mẹ + 30 Kho Con';
PRINT N'3. Phiếu nhập/xuất/chuyển kho với truy xuất nguồn gốc đầy đủ';
PRINT N'4. Log phiên làm việc & lịch sử vật liệu chi tiết';
PRINT N'';
PRINT N'STORED PROCEDURES:';
PRINT N'[Đăng nhập & Phiên]';
PRINT N'  - sp_DangNhap: Đăng nhập & tạo phiên làm việc';
PRINT N'  - sp_DangXuat: Đăng xuất';
PRINT N'';
PRINT N'══════════════════════════════════════════════════════════════════════════════';
PRINT N'  MODULE CẤU TRÚC:';
PRINT N'══════════════════════════════════════════════════════════════════════════════';
PRINT N'';
PRINT N'📦 PHẦN 1: AUTHENTICATION & SESSION (Dùng chung cho Warehouse + Buoy)';
PRINT N'   ├─ VaiTro: ADMIN, NHAN_VIEN';
PRINT N'   ├─ TaiKhoan: User accounts cơ bản (username, password, email, phone)';
PRINT N'   ├─ PhienLamViec: Session tracking (IP, device, login/logout time)';
PRINT N'   └─ SPs: sp_DangNhap, sp_DangXuat, sp_TaoTaiKhoan, sp_ThayDoiVaiTro, sp_KhoaTaiKhoan';
PRINT N'   └─ NOTE: KHÔNG bao gồm DmTramQuanLy (thuộc Buoy module)';
PRINT N'';
PRINT N'📦 PHẦN 2: WAREHOUSE MANAGEMENT (Độc lập - KHÔNG liên quan phao)';
PRINT N'   ├─ Kho: Kho mẹ + 30 kho con (chỉ quản lý vật liệu tổng quát)';
PRINT N'   ├─ VatLieu: Danh mục vật liệu, nhóm vật liệu, đơn vị tính';
PRINT N'   ├─ TonKho: Real-time inventory với computed column SoLuongKhaDung';
PRINT N'   ├─ PhieuNhapXuat: Phiếu nhập/xuất/chuyển kho';
PRINT N'   ├─ ChiTietPhieuNhapXuat: Chi tiết vật liệu trong phiếu';
PRINT N'   ├─ LichSuVatLieu: Audit trail mọi thay đổi';
PRINT N'   └─ SPs: sp_NhapKho, sp_XuatKho, sp_ChuyenKho, sp_XemPhieu_TheoQuyen, sp_BaoCao_LichSuVatLieu';
PRINT N'';
PRINT N'══════════════════════════════════════════════════════════════════════════════';
PRINT N'  STORED PROCEDURES:';
PRINT N'══════════════════════════════════════════════════════════════════════════════';
PRINT N'';
PRINT N'[Authentication & Session - Dùng chung]';
PRINT N'  - sp_DangNhap: Tạo phiên làm việc';
PRINT N'  - sp_DangXuat: Đóng phiên làm việc';
PRINT N'  - sp_LayLichSuPhienLamViec: Log tất cả phiên làm việc';
PRINT N'';
PRINT N'[Quản lý Kho - Warehouse only]';
PRINT N'  - sp_NhapKho: Nhập vật liệu vào kho';
PRINT N'  - sp_XuatKho: Xuất vật liệu từ kho';
PRINT N'  - sp_ChuyenKho: Chuyển vật liệu giữa các kho (Kho Mẹ ↔ Kho Con)';
PRINT N'';
PRINT N'[Báo cáo theo Phân quyền - Warehouse only]';
PRINT N'  - sp_XemPhieu_TheoQuyen: Xem phiếu theo vai trò';
PRINT N'  - sp_BaoCao_LichSuVatLieu: Lịch sử vật liệu theo quyền';
PRINT N'  - sp_BaoCao_HoatDongTheoPhien: Chi tiết hoạt động 1 phiên';
PRINT N'';
PRINT N'[Quản trị - Admin only, dùng chung]';
PRINT N'  - sp_TaoTaiKhoan: Tạo tài khoản mới';
PRINT N'  - sp_ThayDoiVaiTro: Phân quyền nhân viên';
PRINT N'  - sp_KhoaTaiKhoan: Khóa/Mở khóa/Xóa tài khoản';
PRINT N'';
PRINT N'VIEWS - Warehouse only:';
PRINT N'  - vw_TonKho_TheoKhoCon: Tồn kho từng kho con';
PRINT N'  - vw_TonKho_TongHop: Tổng hợp tồn kho tất cả kho';
PRINT N'  - vw_BaoCao_PhieuTheoNhanVien: Phiếu của nhân viên';
PRINT N'  - vw_BaoCao_TatCaPhieu: Tất cả phiếu (Nhân viên/Admin)';
PRINT N'=================================================================';
GO
