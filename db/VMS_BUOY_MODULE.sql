-- =============================================
-- VMS BUOY LIFECYCLE MANAGEMENT MODULE
-- COMPLETE DATABASE SCRIPT (v1.1)
-- Vessel Management System - Maritime Buoy Operations
-- =============================================
-- Author: Nguyen Ngoc Binh
-- Date: 2026-02-27
-- Version: 1.1
-- Description: Schema hoàn chỉnh quản lý vòng đời phao báo hiệu hàng hải.
--   Tích hợp snapshot pattern, lịch sử hoạt động, bảo trì, thay thế thiết bị,
--   cùng đầy đủ thông tin hành chính (trạm, tỉnh, đơn vị), thông tin đèn,
--   xích, rùa, quyết định tăng tài sản.
-- =============================================

-- USE VMS_DB;
-- GO

-- =============================================
-- SECTION 1: DANH MỤC (DICTIONARIES)
-- =============================================

-- Tuyến luồng
CREATE TABLE DmTuyenLuong
(
  Id INT IDENTITY(1,1) PRIMARY KEY,
  MaTuyen NVARCHAR(50) NOT NULL UNIQUE,
  TenTuyen NVARCHAR(255) NOT NULL,
  MoTa NVARCHAR(MAX),
  ThuTuHienThi INT,
  TrangThai NVARCHAR(50) DEFAULT N'Hoạt động',
  NgayTao DATETIME2 DEFAULT GETDATE(),
  NguoiTao NVARCHAR(100),
  NgayCapNhat DATETIME2,
  NguoiCapNhat NVARCHAR(100)
);

-- Vị trí Phao Báo Hiệu trên luồng
CREATE TABLE DmViTriPhaoBH
(
  Id INT IDENTITY(1,1) PRIMARY KEY,
  TuyenLuongId INT NOT NULL,
  SoViTri NVARCHAR(50) NOT NULL,
  -- "0", "1", "4A", "PC"...
  MaPhaoBH NVARCHAR(50) NOT NULL UNIQUE,
  -- "4A"-QN, "P1"-PQ
  ToaDoThietKe NVARCHAR(100),
  -- "13°46.70'N 109°13.70'E"
  MoTa NVARCHAR(MAX),
  ThuTuHienThi INT,
  TrangThai NVARCHAR(50) DEFAULT N'Hoạt động',
  NgayTao DATETIME2 DEFAULT GETDATE(),
  NguoiTao NVARCHAR(100),
  FOREIGN KEY (TuyenLuongId) REFERENCES DmTuyenLuong(Id)
);

-- Đơn vị quản lý / vận hành
CREATE TABLE DmDonVi
(
  Id INT IDENTITY(1,1) PRIMARY KEY,
  MaDonVi NVARCHAR(50) NOT NULL UNIQUE,
  TenDonVi NVARCHAR(255) NOT NULL,
  LoaiDonVi NVARCHAR(100),
  -- 'Công ty', 'Chi nhánh', 'Trạm'...
  DiaChi NVARCHAR(500),
  SoDienThoai NVARCHAR(50),
  ThuTuHienThi INT,
  TrangThai NVARCHAR(50) DEFAULT N'Hoạt động',
  NgayTao DATETIME2 DEFAULT GETDATE(),
  NguoiTao NVARCHAR(100),
  NgayCapNhat DATETIME2,
  NguoiCapNhat NVARCHAR(100)
);

-- Trạm quản lý báo hiệu luồng hàng hải
CREATE TABLE DmTramQuanLy
(
  Id INT IDENTITY(1,1) PRIMARY KEY,
  MaTram NVARCHAR(50) NOT NULL UNIQUE,
  TenTram NVARCHAR(255) NOT NULL,
  DonViChuQuanId INT,
  -- FK → DmDonVi
  DiaDiem NVARCHAR(255),
  SoDienThoai NVARCHAR(50),
  ThuTuHienThi INT,
  TrangThai NVARCHAR(50) DEFAULT N'Hoạt động',
  NgayTao DATETIME2 DEFAULT GETDATE(),
  NguoiTao NVARCHAR(100),
  NgayCapNhat DATETIME2,
  NguoiCapNhat NVARCHAR(100),
  CONSTRAINT FK_TramQuanLy_DonVi FOREIGN KEY (DonViChuQuanId) REFERENCES DmDonVi(Id)
);

-- Tỉnh / Thành phố
CREATE TABLE DmTinhThanhPho
(
  Id INT IDENTITY(1,1) PRIMARY KEY,
  MaTinh NVARCHAR(10) NOT NULL UNIQUE,
  -- 'GL', 'QNH', 'KH'...
  TenTinh NVARCHAR(255) NOT NULL,
  ThuTuHienThi INT,
  TrangThai NVARCHAR(50) DEFAULT N'Hoạt động',
  NgayTao DATETIME2 DEFAULT GETDATE(),
  NguoiTao NVARCHAR(100)
);

-- =============================================
-- SECTION 2: QUẢN LÝ PHAO (MASTER TABLE)
-- =============================================

CREATE TABLE Phao
(
  Id INT IDENTITY(1,1) PRIMARY KEY,

  -- Định danh
  KyHieuTaiSan NVARCHAR(50) UNIQUE,
  -- KCHT40861
  MaPhaoDayDu NVARCHAR(50) NOT NULL UNIQUE,
  -- D24.020.16 hoặc T2,6-020-23
  MaLoaiPhao AS (LEFT(MaPhaoDayDu, CHARINDEX('.', MaPhaoDayDu) - 1)) PERSISTED,
  -- D24, DN24, T26...
  TenPhao NVARCHAR(255),
  -- Tên đầy đủ của phao, tiêu. VD: Phao T2,6-020-23
  SoPhaoHienTai INT,
  -- STT trên luồng: 1, 2, 3...

  -- Thông tin chung – thời gian
  ThoiGianSuDung INT,
  -- Thời gian sử dụng tính theo năm. VD: 0
  ThoiDiemThayTha DATE,
  -- Thời điểm thay, thả xuống luồng. VD: 2025-08-23
  ThoiDiemSuaChuaGanNhat DATE,
  -- Thời điểm sửa chữa gần nhất. VD: 2025-12-24

  -- Kỹ thuật cơ bản
  DuongKinhPhao DECIMAL(10, 2),
  -- m
  ChieuCaoToanBo DECIMAL(10, 2),
  -- m. VD: 7.47
  HinhDang NVARCHAR(100),
  -- Trụ, Côn, Hình thấp lưới...
  VatLieu NVARCHAR(100),
  -- Thép, Composite
  MauSac NVARCHAR(100),
  -- Đỏ, Xanh lục, Vàng...

  -- Xích phao
  XichPhao_DuongKinh DECIMAL(10, 2),
  -- mm. VD: 36.00
  XichPhao_ChieuDai DECIMAL(10, 2),
  -- m. VD: 15.00
  XichPhao_ThoiDiemSuDung DATE,
  -- VD: 2025-10-12

  -- Xích rùa
  XichRua_DuongKinh DECIMAL(10, 2),
  -- mm. VD: 36.00
  XichRua_ChieuDai DECIMAL(10, 2),
  -- m. VD: 15.00
  XichRua_ThoiDiemSuDung DATE,
  -- VD: 2025-10-12

  -- Rùa (neo chìm)
  Rua_TrongLuong DECIMAL(10, 2),
  -- tấn. VD: 6.00
  Rua_ThoiDiemSuDung DATE,
  -- VD: 2025-11-12

  -- Đèn báo hiệu trên phao
  Den_ChungLoai NVARCHAR(100),
  -- VD: led KJDHF.SJDHF3
  Den_KetNoiAIS BIT,
  -- 1 = Có, 0 = Không
  Den_DacTinhAnhSang NVARCHAR(255),
  -- VD: Ánh sáng Xanh, Chớp đơn
  Den_ChieuXaTamSang DECIMAL(10, 2),
  -- Khoảng cách nhìn thấy (hải lý)
  Den_ChieuCaoTamSangHaiDo DECIMAL(10, 2),
  -- Chiều cao tâm sáng hải đồ (m). VD: 4.70
  Den_NguonCapNangLuong NVARCHAR(100),
  -- VD: Ắc quy và điện mặt trời
  Den_ThoiDiemSuDung DATE,
  -- VD: 2024-01-01
  Den_ThoiDiemSuaChua DATE,
  -- Thời điểm sửa chữa đèn gần nhất. VD: 2024-09-12
  Den_SoQuyetDinhTang NVARCHAR(100),
  -- Số quyết định tăng của đèn. VD: 11SFD

  -- Thông tin hành chính
  TramQuanLyId INT,
  -- FK → DmTramQuanLy
  TinhThanhPhoId INT,
  -- FK → DmTinhThanhPho
  DonViQuanLyId INT,
  -- FK → DmDonVi
  DonViVanHanhId INT,
  -- FK → DmDonVi

  -- Quyết định tăng tài sản
  SoQuyetDinhTang NVARCHAR(100),
  -- VD: 2AFSAF
  NgayQuyetDinhTang DATE,
  -- VD: 2024-05-13
  DienTich DECIMAL(10, 2),
  -- Diện tích (m²). VD: 5.23

  -- Trạng thái hiện tại (cache để query nhanh)
  TrangThaiHienTai NVARCHAR(255),
  -- 'Trên luồng', 'Trên bãi', 'Thu hồi', 'Không sử dụng'...
  ViTriPhaoBHHienTaiId INT,
  -- FK → DmViTriPhaoBH

  -- Audit
  NgayTao DATETIME2 DEFAULT GETDATE(),
  NguoiTao NVARCHAR(100),
  NgayCapNhat DATETIME2,
  NguoiCapNhat NVARCHAR(100),

  CONSTRAINT FK_Phao_ViTriPhaoBH FOREIGN KEY (ViTriPhaoBHHienTaiId) REFERENCES DmViTriPhaoBH(Id),
  CONSTRAINT FK_Phao_TramQuanLy FOREIGN KEY (TramQuanLyId) REFERENCES DmTramQuanLy(Id),
  CONSTRAINT FK_Phao_TinhThanhPho FOREIGN KEY (TinhThanhPhoId) REFERENCES DmTinhThanhPho(Id),
  CONSTRAINT FK_Phao_DonViQuanLy FOREIGN KEY (DonViQuanLyId) REFERENCES DmDonVi(Id),
  CONSTRAINT FK_Phao_DonViVanHanh FOREIGN KEY (DonViVanHanhId) REFERENCES DmDonVi(Id)
);

-- =============================================
-- SECTION 3: LỊCH SỬ HOẠT ĐỘNG PHAO (CORE)
-- =============================================

CREATE TABLE LichSuHoatDongPhao
(
  Id INT IDENTITY(1,1) PRIMARY KEY,
  PhaoId INT NOT NULL,

  -- Thời gian
  Nam INT NOT NULL,
  -- 2014, 2015, 2016...
  NgayBatDau DATE NOT NULL,
  NgayKetThuc DATE,
  -- NULL = Đang diễn ra

  -- Trạng thái
  LoaiTrangThai NVARCHAR(50) NOT NULL,
  -- TREN_LUONG, THU_HOI, TREN_BAI, CHO_THUE, XIN_THANH_LY, SU_CO
  MoTaTrangThai NVARCHAR(MAX),
  -- "4A"-QN, "Trên bãi Phú Quý", "Thu hồi về"

  -- Snapshot vị trí (lưu tại thời điểm đó)
  ViTriPhaoBHId INT,
  -- FK → DmViTriPhaoBH
  MaPhaoBH NVARCHAR(50),
  -- Snapshot: "4A"-QN
  MaTuyenLuong NVARCHAR(50),
  -- Snapshot: QN

  -- Tọa độ thực tế
  KinhDo DECIMAL(10, 6),
  -- VD: 108.923333 (từ 108°55.40'E)
  ViDo DECIMAL(10, 6),
  -- VD: 10.502500 (từ 10°30.15'N)
  DiaDiem NVARCHAR(255),
  -- "Bãi Phú Quý", "Kho Pquy"

  -- Metadata
  GhiChu NVARCHAR(MAX),
  NgayTao DATETIME2 DEFAULT GETDATE(),
  NguoiTao NVARCHAR(100),

  FOREIGN KEY (PhaoId) REFERENCES Phao(Id),
  FOREIGN KEY (ViTriPhaoBHId) REFERENCES DmViTriPhaoBH(Id)
);

-- =============================================
-- SECTION 4: BẢO TRÌ & THAY ĐỔI THIẾT BỊ
-- =============================================

CREATE TABLE LichSuBaoTri
(
  Id INT IDENTITY(1,1) PRIMARY KEY,
  PhaoId INT NOT NULL,
  LoaiBaoTri NVARCHAR(100) NOT NULL,
  -- Định kỳ, Sửa chữa, Khẩn cấp
  NgayBaoTri DATE NOT NULL,
  NoiDungCongViec NVARCHAR(MAX),
  KetQuaBaoTri NVARCHAR(MAX),
  ChiPhi DECIMAL(18, 2),
  DonViThucHien NVARCHAR(255),
  NguoiPhuTrach NVARCHAR(100),
  GhiChu NVARCHAR(MAX),
  NgayTao DATETIME2 DEFAULT GETDATE(),
  NguoiTao NVARCHAR(100),
  FOREIGN KEY (PhaoId) REFERENCES Phao(Id)
);

CREATE TABLE LichSuThayDoiThietBi
(
  Id INT IDENTITY(1,1) PRIMARY KEY,
  PhaoId INT NOT NULL,
  LoaiThietBi NVARCHAR(100) NOT NULL,
  -- Xích phao, Xích rùa, Rùa, Đèn
  NgayThayDoi DATE NOT NULL,
  ThongTinCu NVARCHAR(MAX),
  ThongTinMoi NVARCHAR(MAX),
  LyDoThayDoi NVARCHAR(MAX),
  GhiChu NVARCHAR(MAX),
  NgayTao DATETIME2 DEFAULT GETDATE(),
  NguoiTao NVARCHAR(100),
  FOREIGN KEY (PhaoId) REFERENCES Phao(Id)
);

-- =============================================
-- SECTION 5: INDEXES
-- =============================================

-- Phao indexes
CREATE NONCLUSTERED INDEX IX_Phao_MaLoaiPhao ON Phao(MaLoaiPhao);
CREATE NONCLUSTERED INDEX IX_Phao_TrangThaiHienTai ON Phao(TrangThaiHienTai);
CREATE NONCLUSTERED INDEX IX_Phao_ViTriPhaoBHHienTaiId ON Phao(ViTriPhaoBHHienTaiId);
CREATE NONCLUSTERED INDEX IX_Phao_TramQuanLyId ON Phao(TramQuanLyId);
CREATE NONCLUSTERED INDEX IX_Phao_TinhThanhPhoId ON Phao(TinhThanhPhoId);
CREATE NONCLUSTERED INDEX IX_Phao_DonViQuanLyId ON Phao(DonViQuanLyId);
CREATE NONCLUSTERED INDEX IX_Phao_DonViVanHanhId ON Phao(DonViVanHanhId);

-- LichSuHoatDongPhao indexes
CREATE NONCLUSTERED INDEX IX_LichSuHoatDong_PhaoId_Nam ON LichSuHoatDongPhao(PhaoId, Nam);
CREATE NONCLUSTERED INDEX IX_LichSuHoatDong_LoaiTrangThai ON LichSuHoatDongPhao(LoaiTrangThai);
CREATE NONCLUSTERED INDEX IX_LichSuHoatDong_NgayKetThuc ON LichSuHoatDongPhao(NgayKetThuc);
CREATE NONCLUSTERED INDEX IX_LichSuHoatDong_ViTriPhaoBHId ON LichSuHoatDongPhao(ViTriPhaoBHId);
CREATE NONCLUSTERED INDEX IX_LichSuHoatDong_MaTuyenLuong ON LichSuHoatDongPhao(MaTuyenLuong);

-- DmViTriPhaoBH indexes
CREATE NONCLUSTERED INDEX IX_ViTriPhaoBH_TuyenLuongId ON DmViTriPhaoBH(TuyenLuongId);

-- DmTramQuanLy indexes
CREATE NONCLUSTERED INDEX IX_DmTramQuanLy_DonViChuQuanId ON DmTramQuanLy(DonViChuQuanId);

-- LichSuBaoTri indexes
CREATE NONCLUSTERED INDEX IX_BaoTri_PhaoId_NgayBaoTri ON LichSuBaoTri(PhaoId, NgayBaoTri);

-- LichSuThayDoiThietBi indexes
CREATE NONCLUSTERED INDEX IX_ThayDoiThietBi_PhaoId_NgayThayDoi ON LichSuThayDoiThietBi(PhaoId, NgayThayDoi);

-- =============================================
-- SECTION 6: STORED PROCEDURES - VỊ TRÍ & TUYẾN
-- =============================================

GO
CREATE PROCEDURE sp_LayViTriPhaoBH_TheoTuyen
  @TuyenLuongId INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    vt.Id,
    vt.SoViTri,
    vt.MaPhaoBH,
    vt.ToaDoThietKe,
    vt.MoTa,
    vt.ThuTuHienThi,
    p.Id AS PhaoHienTaiId,
    p.MaPhaoDayDu AS PhaoHienTai,
    p.MaLoaiPhao AS LoaiPhaoHienTai,
    CASE WHEN p.Id IS NULL THEN 1 ELSE 0 END AS CoTheChon,
    CASE WHEN p.Id IS NULL THEN N'Trống' ELSE N'Đã có phao: ' + p.MaPhaoDayDu END AS MoTaTrangThai
  FROM DmViTriPhaoBH vt
    LEFT JOIN (
      SELECT PhaoId, ViTriPhaoBHId
      FROM LichSuHoatDongPhao
      WHERE LoaiTrangThai = N'TREN_LUONG' AND NgayKetThuc IS NULL
    ) ls ON vt.Id = ls.ViTriPhaoBHId
    LEFT JOIN Phao p ON ls.PhaoId = p.Id
  WHERE vt.TuyenLuongId = @TuyenLuongId
    AND vt.TrangThai = N'Hoạt động'
  ORDER BY vt.ThuTuHienThi;
END;
GO

-- =============================================
-- SECTION 7: STORED PROCEDURES - VALIDATION
-- =============================================

GO
CREATE PROCEDURE sp_ValidateThemHoatDongPhao
  @PhaoId INT,
  @ViTriPhaoBHId INT,
  @NgayLapDat DATE,
  @IsValid BIT OUTPUT,
  @Message NVARCHAR(500) OUTPUT,
  @PhaoHienTai NVARCHAR(50) OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  SET @IsValid = 1;
  SET @Message = N'Hợp lệ';
  SET @PhaoHienTai = NULL;

  -- Check 1: Vị trí đã có phao khác chưa?
  IF EXISTS (
    SELECT 1 FROM LichSuHoatDongPhao
    WHERE ViTriPhaoBHId = @ViTriPhaoBHId
      AND LoaiTrangThai = N'TREN_LUONG'
      AND NgayKetThuc IS NULL
      AND PhaoId <> @PhaoId
  )
  BEGIN
    SET @IsValid = 0;
    SET @Message = N'Vị trí này đã có phao khác đang hoạt động!';
    SELECT @PhaoHienTai = p.MaPhaoDayDu
    FROM LichSuHoatDongPhao ls
      INNER JOIN Phao p ON ls.PhaoId = p.Id
    WHERE ls.ViTriPhaoBHId = @ViTriPhaoBHId AND ls.NgayKetThuc IS NULL;
    RETURN;
  END

  -- Check 2: Phao có đang ở luồng khác không?
  DECLARE @ViTriHienTai NVARCHAR(50);
  SELECT @ViTriHienTai = MaPhaoBH
  FROM LichSuHoatDongPhao
  WHERE PhaoId = @PhaoId AND LoaiTrangThai = N'TREN_LUONG' AND NgayKetThuc IS NULL;

  IF @ViTriHienTai IS NOT NULL
  BEGIN
    SET @IsValid = 0;
    SET @Message = N'Phao đang ở vị trí: ' + @ViTriHienTai + N'. Vui lòng thu hồi trước!';
    RETURN;
  END

  -- Check 3: Ngày lắp đặt hợp lệ
  IF @NgayLapDat > GETDATE()
  BEGIN
    SET @IsValid = 0;
    SET @Message = N'Ngày lắp đặt không được trong tương lai!';
    RETURN;
  END

  IF @NgayLapDat < DATEADD(YEAR, -2, GETDATE())
  BEGIN
    SET @IsValid = 0;
    SET @Message = N'Ngày lắp đặt quá xa trong quá khứ (> 2 năm)!';
    RETURN;
  END
END;
GO

-- =============================================
-- SECTION 8: STORED PROCEDURES - THÊM HOẠT ĐỘNG
-- =============================================

GO
CREATE PROCEDURE sp_ThemHoatDongPhao
  @PhaoId INT,
  @ViTriPhaoBHId INT,
  @NgayLapDat DATE,
  @GhiChu NVARCHAR(MAX) = NULL,
  @NguoiTao NVARCHAR(100) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRANSACTION;

  BEGIN TRY
    DECLARE @IsValid BIT;
    DECLARE @Message NVARCHAR(500);
    DECLARE @PhaoHienTai NVARCHAR(50);

    EXEC sp_ValidateThemHoatDongPhao
      @PhaoId = @PhaoId,
      @ViTriPhaoBHId = @ViTriPhaoBHId,
      @NgayLapDat = @NgayLapDat,
      @IsValid = @IsValid OUTPUT,
      @Message = @Message OUTPUT,
      @PhaoHienTai = @PhaoHienTai OUTPUT;

    IF @IsValid = 0
    BEGIN
      ROLLBACK TRANSACTION;
      SELECT 0 AS Success, @Message AS Message, @PhaoHienTai AS PhaoHienTai;
      RETURN;
    END

    UPDATE LichSuHoatDongPhao
    SET NgayKetThuc = @NgayLapDat
    WHERE PhaoId = @PhaoId AND NgayKetThuc IS NULL;

    DECLARE @MaPhaoBH NVARCHAR(50);
    DECLARE @MaTuyenLuong NVARCHAR(50);
    DECLARE @Nam INT = YEAR(@NgayLapDat);

    SELECT
      @MaPhaoBH = vt.MaPhaoBH,
      @MaTuyenLuong = tl.MaTuyen
    FROM DmViTriPhaoBH vt
      INNER JOIN DmTuyenLuong tl ON vt.TuyenLuongId = tl.Id
    WHERE vt.Id = @ViTriPhaoBHId;

    INSERT INTO LichSuHoatDongPhao
      (PhaoId, Nam, NgayBatDau, NgayKetThuc, LoaiTrangThai, MoTaTrangThai,
       ViTriPhaoBHId, MaPhaoBH, MaTuyenLuong, GhiChu, NguoiTao, NgayTao)
    VALUES
      (@PhaoId, @Nam, @NgayLapDat, NULL, N'TREN_LUONG', @MaPhaoBH,
       @ViTriPhaoBHId, @MaPhaoBH, @MaTuyenLuong, @GhiChu, @NguoiTao, GETDATE());

    DECLARE @LichSuId INT = SCOPE_IDENTITY();

    UPDATE Phao
    SET TrangThaiHienTai = @MaPhaoBH,
        ViTriPhaoBHHienTaiId = @ViTriPhaoBHId,
        NgayCapNhat = GETDATE()
    WHERE Id = @PhaoId;

    COMMIT TRANSACTION;

    SELECT 1 AS Success,
      N'Lắp đặt phao lên vị trí ' + @MaPhaoBH + N' thành công!' AS Message,
      @LichSuId AS LichSuId,
      @MaPhaoBH AS ViTriMoi;
  END TRY
  BEGIN CATCH
    ROLLBACK TRANSACTION;
    SELECT 0 AS Success, ERROR_MESSAGE() AS Message;
  END CATCH
END;
GO

-- =============================================
-- SECTION 9: STORED PROCEDURES - THU HỒI & DI CHUYỂN
-- =============================================

GO
CREATE PROCEDURE sp_ThuHoiPhao
  @PhaoId INT,
  @NgayThuHoi DATE,
  @DiaDiem NVARCHAR(255) = N'Bãi Phú Quý',
  @GhiChu NVARCHAR(MAX) = NULL,
  @NguoiTao NVARCHAR(100) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRANSACTION;

  BEGIN TRY
    UPDATE LichSuHoatDongPhao
    SET NgayKetThuc = @NgayThuHoi
    WHERE PhaoId = @PhaoId AND NgayKetThuc IS NULL;

    DECLARE @Nam INT = YEAR(@NgayThuHoi);

    INSERT INTO LichSuHoatDongPhao
      (PhaoId, Nam, NgayBatDau, NgayKetThuc, LoaiTrangThai, MoTaTrangThai,
       DiaDiem, GhiChu, NguoiTao, NgayTao)
    VALUES
      (@PhaoId, @Nam, @NgayThuHoi, NULL,
       N'THU_HOI', N'Thu hồi về ' + @DiaDiem,
       @DiaDiem, @GhiChu, @NguoiTao, GETDATE());

    UPDATE Phao
    SET TrangThaiHienTai = N'Thu hồi',
        ViTriPhaoBHHienTaiId = NULL,
        NgayCapNhat = GETDATE()
    WHERE Id = @PhaoId;

    COMMIT TRANSACTION;
    SELECT 1 AS Success, N'Thu hồi phao thành công!' AS Message;
  END TRY
  BEGIN CATCH
    ROLLBACK TRANSACTION;
    SELECT 0 AS Success, ERROR_MESSAGE() AS Message;
  END CATCH
END;
GO

GO
CREATE PROCEDURE sp_ChuyenPhaoSangViTriMoi
  @PhaoId INT,
  @ViTriPhaoBHMoi INT,
  @NgayChuyen DATE,
  @GhiChu NVARCHAR(MAX) = NULL,
  @NguoiTao NVARCHAR(100) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  EXEC sp_ThemHoatDongPhao
    @PhaoId = @PhaoId,
    @ViTriPhaoBHId = @ViTriPhaoBHMoi,
    @NgayLapDat = @NgayChuyen,
    @GhiChu = @GhiChu,
    @NguoiTao = @NguoiTao;
END;
GO

-- =============================================
-- SECTION 10: STORED PROCEDURES - BẢO TRÌ
-- =============================================

GO
CREATE PROCEDURE sp_ThemLichSuBaoTri
  @PhaoId INT,
  @LoaiBaoTri NVARCHAR(100),
  @NgayBaoTri DATE,
  @NoiDungCongViec NVARCHAR(MAX),
  @KetQuaBaoTri NVARCHAR(MAX) = NULL,
  @ChiPhi DECIMAL(18, 2) = NULL,
  @DonViThucHien NVARCHAR(255) = NULL,
  @NguoiPhuTrach NVARCHAR(100) = NULL,
  @GhiChu NVARCHAR(MAX) = NULL,
  @NguoiTao NVARCHAR(100) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  INSERT INTO LichSuBaoTri
    (PhaoId, LoaiBaoTri, NgayBaoTri, NoiDungCongViec, KetQuaBaoTri, ChiPhi,
     DonViThucHien, NguoiPhuTrach, GhiChu, NguoiTao, NgayTao)
  VALUES
    (@PhaoId, @LoaiBaoTri, @NgayBaoTri, @NoiDungCongViec, @KetQuaBaoTri, @ChiPhi,
     @DonViThucHien, @NguoiPhuTrach, @GhiChu, @NguoiTao, GETDATE());

  SELECT 1 AS Success, N'Thêm lịch sử bảo trì thành công!' AS Message, SCOPE_IDENTITY() AS BaoTriId;
END;
GO

GO
CREATE PROCEDURE sp_ThemLichSuThayDoiThietBi
  @PhaoId INT,
  @LoaiThietBi NVARCHAR(100),
  @NgayThayDoi DATE,
  @ThongTinCu NVARCHAR(MAX),
  @ThongTinMoi NVARCHAR(MAX),
  @LyDoThayDoi NVARCHAR(MAX) = NULL,
  @GhiChu NVARCHAR(MAX) = NULL,
  @NguoiTao NVARCHAR(100) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  INSERT INTO LichSuThayDoiThietBi
    (PhaoId, LoaiThietBi, NgayThayDoi, ThongTinCu, ThongTinMoi, LyDoThayDoi,
     GhiChu, NguoiTao, NgayTao)
  VALUES
    (@PhaoId, @LoaiThietBi, @NgayThayDoi, @ThongTinCu, @ThongTinMoi, @LyDoThayDoi,
     @GhiChu, @NguoiTao, GETDATE());

  SELECT 1 AS Success, N'Thêm lịch sử thay đổi thiết bị thành công!' AS Message, SCOPE_IDENTITY() AS ThayDoiId;
END;
GO

-- =============================================
-- SECTION 11: FUNCTIONS
-- =============================================

GO
CREATE FUNCTION fn_LayPhaoDangOViTriTheoNgay(
  @ViTriPhaoBHId INT,
  @NgayKiemTra DATE
)
RETURNS TABLE
AS
RETURN
(
  SELECT TOP 1
    p.Id AS PhaoId,
    p.MaPhaoDayDu,
    p.MaLoaiPhao,
    ls.MaPhaoBH AS ViTri,
    ls.NgayBatDau,
    ls.NgayKetThuc
  FROM LichSuHoatDongPhao ls
    INNER JOIN Phao p ON ls.PhaoId = p.Id
  WHERE ls.ViTriPhaoBHId = @ViTriPhaoBHId
    AND ls.LoaiTrangThai = N'TREN_LUONG'
    AND @NgayKiemTra >= ls.NgayBatDau
    AND (@NgayKiemTra <= ls.NgayKetThuc OR ls.NgayKetThuc IS NULL)
);
GO

GO
CREATE FUNCTION fn_LayTrangThaiPhaoTheoNam(
  @PhaoId INT,
  @Nam INT
)
RETURNS TABLE
AS
RETURN
(
  SELECT
    Id, PhaoId, Nam, NgayBatDau, NgayKetThuc,
    LoaiTrangThai, MoTaTrangThai, MaPhaoBH, MaTuyenLuong,
    DATEDIFF(DAY, NgayBatDau, ISNULL(NgayKetThuc, GETDATE())) AS SoNgayHoatDong
  FROM LichSuHoatDongPhao
  WHERE PhaoId = @PhaoId AND Nam = @Nam
);
GO

-- =============================================
-- SECTION 12: VIEWS
-- =============================================

-- View: Trạng thái đầy đủ hiện tại của tất cả phao
GO
CREATE VIEW vw_TrangThaiPhaoHienTai
AS
  SELECT
    p.Id AS PhaoId,
    p.KyHieuTaiSan,
    p.MaPhaoDayDu,
    p.TenPhao,
    p.MaLoaiPhao,
    p.SoPhaoHienTai,
    -- Kỹ thuật
    p.HinhDang,
    p.VatLieu,
    p.MauSac,
    p.ChieuCaoToanBo,
    p.DuongKinhPhao,
    -- Thời gian
    p.ThoiGianSuDung,
    p.ThoiDiemThayTha,
    p.ThoiDiemSuaChuaGanNhat,
    -- Xích phao
    p.XichPhao_DuongKinh,
    p.XichPhao_ChieuDai,
    p.XichPhao_ThoiDiemSuDung,
    -- Xích rùa
    p.XichRua_DuongKinh,
    p.XichRua_ChieuDai,
    p.XichRua_ThoiDiemSuDung,
    -- Rùa
    p.Rua_TrongLuong,
    p.Rua_ThoiDiemSuDung,
    -- Đèn
    p.Den_ChungLoai,
    p.Den_KetNoiAIS,
    p.Den_DacTinhAnhSang,
    p.Den_ChieuXaTamSang,
    p.Den_ChieuCaoTamSangHaiDo,
    p.Den_NguonCapNangLuong,
    p.Den_ThoiDiemSuDung,
    p.Den_ThoiDiemSuaChua,
    p.Den_SoQuyetDinhTang,
    -- Trạng thái & vị trí
    p.TrangThaiHienTai,
    vt.MaPhaoBH AS ViTriHienTai,
    tl.TenTuyen AS TuyenHienTai,
    -- Hành chính
    tram.TenTram AS TramQuanLy,
    tinh.TenTinh AS TinhThanhPho,
    dvql.TenDonVi AS DonViQuanLy,
    dvvh.TenDonVi AS DonViVanHanh,
    p.SoQuyetDinhTang,
    p.NgayQuyetDinhTang,
    p.DienTich,
    -- Tọa độ từ lịch sử hoạt động hiện tại
    ls.KinhDo,
    ls.ViDo,
    ls.NgayBatDau AS NgayBatDauTrangThaiHienTai,
    ls.LoaiTrangThai,
    ls.MoTaTrangThai,
    ls.GhiChu
  FROM Phao p
    LEFT JOIN DmViTriPhaoBH vt ON p.ViTriPhaoBHHienTaiId = vt.Id
    LEFT JOIN DmTuyenLuong tl ON vt.TuyenLuongId = tl.Id
    LEFT JOIN DmTramQuanLy tram ON p.TramQuanLyId = tram.Id
    LEFT JOIN DmTinhThanhPho tinh ON p.TinhThanhPhoId = tinh.Id
    LEFT JOIN DmDonVi dvql ON p.DonViQuanLyId = dvql.Id
    LEFT JOIN DmDonVi dvvh ON p.DonViVanHanhId = dvvh.Id
    LEFT JOIN LichSuHoatDongPhao ls ON p.Id = ls.PhaoId AND ls.NgayKetThuc IS NULL;
GO

-- View: Báo cáo phao theo loại
GO
CREATE VIEW vw_BaoCaoPhaoTheoLoai
AS
  SELECT
    p.MaLoaiPhao,
    COUNT(*) AS TongSoPhao,
    SUM(CASE WHEN ls.LoaiTrangThai = N'TREN_LUONG' THEN 1 ELSE 0 END) AS SoPhaoTrenLuong,
    SUM(CASE WHEN ls.LoaiTrangThai = N'TREN_BAI' THEN 1 ELSE 0 END) AS SoPhaoTrenBai,
    SUM(CASE WHEN ls.LoaiTrangThai = N'THU_HOI' THEN 1 ELSE 0 END) AS SoPhaoThuHoi,
    SUM(CASE WHEN ls.LoaiTrangThai = N'SU_CO' THEN 1 ELSE 0 END) AS SoPhaoSuCo
  FROM Phao p
    LEFT JOIN LichSuHoatDongPhao ls ON p.Id = ls.PhaoId AND ls.NgayKetThuc IS NULL
  GROUP BY p.MaLoaiPhao;
GO

-- =============================================
-- SECTION 13: SAMPLE DATA
-- =============================================

-- Đơn vị
INSERT INTO DmDonVi
  (MaDonVi, TenDonVi, LoaiDonVi, ThuTuHienThi, NguoiTao)
VALUES
  (N'BĐANHNTB', N'Công ty bảo đảm an toàn hàng hải Nam Trung Bộ', N'Công ty', 1, N'System'),
  (N'BĐANHPN', N'Công ty bảo đảm an toàn hàng hải Miền Nam', N'Công ty', 2, N'System'),
  (N'BĐANHPB', N'Công ty bảo đảm an toàn hàng hải Miền Bắc', N'Công ty', 3, N'System');

-- Tuyến luồng
INSERT INTO DmTuyenLuong
  (MaTuyen, TenTuyen, ThuTuHienThi, NguoiTao)
VALUES
  (N'QN', N'Luồng Quy Nhơn', 1, N'System'),
  (N'ĐTN', N'Luồng Dung Quất - Tiên Sa', 2, N'System'),
  (N'PQ', N'Luồng Phú Quý', 3, N'System'),
  (N'NT', N'Luồng Nha Trang', 4, N'System'),
  (N'CNV', N'Luồng Cam Ranh - Vạn Ninh', 5, N'System');

-- Thêm trạm quản lý
INSERT INTO DmTramQuanLy
  (MaTram, TenTram, DonViChuQuanId, ThuTuHienThi, NguoiTao)
VALUES
  (N'TQBHLHH_QN', N'Trạm quản lý báo hiệu luồng hàng hải Quy Nhơn',
    (SELECT Id FROM DmDonVi WHERE MaDonVi = N'BĐANHNTB'), 1, N'System'),
  (N'TQBHLHH_NT', N'Trạm quản lý báo hiệu luồng hàng hải Nha Trang',
    (SELECT Id FROM DmDonVi WHERE MaDonVi = N'BĐANHNTB'), 2, N'System'),
  (N'TQBHLHH_PQ', N'Trạm quản lý báo hiệu luồng hàng hải Phú Quý',
    (SELECT Id FROM DmDonVi WHERE MaDonVi = N'BĐANHNTB'), 3, N'System');

-- Tỉnh / Thành phố
INSERT INTO DmTinhThanhPho
  (MaTinh, TenTinh, ThuTuHienThi, NguoiTao)
VALUES
  (N'QNH', N'Quảng Ngãi', 1, N'System'),
  (N'BD', N'Bình Định', 2, N'System'),
  (N'PY', N'Phú Yên', 3, N'System'),
  (N'KH', N'Khánh Hòa', 4, N'System'),
  (N'NT', N'Ninh Thuận', 5, N'System'),
  (N'BTH', N'Bình Thuận', 6, N'System'),
  (N'GL', N'Gia Lai', 7, N'System'),
  (N'KT', N'Kon Tum', 8, N'System'),
  (N'DLK', N'Đắk Lắk', 9, N'System'),
  (N'DLG', N'Đà Lạt - Lâm Đồng', 10, N'System');

-- Vị trí Phao BH – Luồng QN
DECLARE @QNId INT = (SELECT Id FROM DmTuyenLuong WHERE MaTuyen = N'QN');
INSERT INTO DmViTriPhaoBH
  (TuyenLuongId, SoViTri, MaPhaoBH, ThuTuHienThi, NguoiTao)
VALUES
  (@QNId, N'0', N'"0"-QN', 1, N'System'),
  (@QNId, N'1', N'"1"-QN', 2, N'System'),
  (@QNId, N'2', N'"2"-QN', 3, N'System'),
  (@QNId, N'3', N'"3"-QN', 4, N'System'),
  (@QNId, N'3A', N'"3A"-QN', 5, N'System'),
  (@QNId, N'4', N'"4"-QN', 6, N'System'),
  (@QNId, N'4A', N'"4A"-QN', 7, N'System'),
  (@QNId, N'5', N'"5"-QN', 8, N'System'),
  (@QNId, N'PC', N'"PC"-QN', 9, N'System');

-- Vị trí Phao BH – Luồng PQ
DECLARE @PQId INT = (SELECT Id FROM DmTuyenLuong WHERE MaTuyen = N'PQ');
INSERT INTO DmViTriPhaoBH
  (TuyenLuongId, SoViTri, MaPhaoBH, ThuTuHienThi, NguoiTao)
VALUES
  (@PQId, N'P0', N'P0-PQ', 1, N'System'),
  (@PQId, N'P1', N'P1-PQ', 2, N'System'),
  (@PQId, N'P2', N'P2-PQ', 3, N'System'),
  (@PQId, N'P3', N'P3-PQ', 4, N'System'),
  (@PQId, N'P4', N'P4-PQ', 5, N'System'),
  (@PQId, N'P5', N'P5-PQ', 6, N'System');

-- Phao mẫu
INSERT INTO Phao
  (
    KyHieuTaiSan, MaPhaoDayDu, TenPhao, SoPhaoHienTai,
    ChieuCaoToanBo, HinhDang, VatLieu, MauSac,
    XichPhao_DuongKinh, XichPhao_ChieuDai, XichPhao_ThoiDiemSuDung,
    XichRua_DuongKinh, XichRua_ChieuDai, XichRua_ThoiDiemSuDung,
    Rua_TrongLuong, Rua_ThoiDiemSuDung,
    Den_ChungLoai, Den_KetNoiAIS, Den_DacTinhAnhSang,
    Den_ChieuCaoTamSangHaiDo, Den_NguonCapNangLuong,
    Den_ThoiDiemSuDung, Den_ThoiDiemSuaChua, Den_SoQuyetDinhTang,
    ThoiGianSuDung, ThoiDiemThayTha, ThoiDiemSuaChuaGanNhat,
    TramQuanLyId, TinhThanhPhoId, DonViQuanLyId, DonViVanHanhId,
    SoQuyetDinhTang, NgayQuyetDinhTang, DienTich,
    TrangThaiHienTai, NguoiTao
  )
VALUES
  (
    N'KCHT40861', N'T26.020.23', N'Phao T2,6-020-23', 1,
    7.47, N'Hình thấp lưới', N'Thép', N'Màu xanh lục',
    36.00, 15.00, '2025-10-12',
    36.00, 15.00, '2025-10-12',
    6.00, '2025-11-12',
    N'led KJDHF.SJDHF3', 1, N'Ánh sáng Xanh, Chớp đơn',
    4.70, N'Ắc quy và điện mặt trời',
    '2024-01-01', '2024-09-12', N'11SFD',
    0, '2025-08-23', '2025-12-24',
    (SELECT Id FROM DmTramQuanLy WHERE MaTram = N'TQBHLHH_QN'),
    (SELECT Id FROM DmTinhThanhPho WHERE MaTinh = N'GL'),
    (SELECT Id FROM DmDonVi WHERE MaDonVi = N'BĐANHNTB'),
    (SELECT Id FROM DmDonVi WHERE MaDonVi = N'BĐANHNTB'),
    N'2AFSAF', '2024-05-13', 5.23,
    N'Trên bãi', N'System'
  ),
  (
    N'KCHT40862', N'DN24.037.02', N'Phao DN24.037.02', 2,
    5.00, N'Trụ côn', N'Composite', N'Đỏ',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL,
    N'Trên bãi', N'System'
  ),
  (
    N'KCHT40863', N'D24.020.16', N'Phao D24.020.16', 3,
    4.50, N'Trụ tròn', N'Thép', N'Đỏ',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL,
    N'Trên bãi', N'System'
  );

-- Lịch sử hoạt động cho phao mẫu đầu tiên
DECLARE @Phao1Id INT = (SELECT Id FROM Phao WHERE KyHieuTaiSan = N'KCHT40861');
INSERT INTO LichSuHoatDongPhao
  (PhaoId, Nam, NgayBatDau, NgayKetThuc, LoaiTrangThai, MoTaTrangThai,
   KinhDo, ViDo, NguoiTao)
VALUES
  (@Phao1Id, 2025, '2025-08-23', NULL, N'TREN_BAI', N'Trên bãi sau khi thay thả',
   108.923333, 10.502500, N'System');

GO

PRINT N'✅ VMS Buoy Module v1.1 được tạo thành công!';
PRINT N'';
PRINT N'📊 Thống kê schema:';
PRINT N'   Tables  : DmTuyenLuong, DmViTriPhaoBH, DmDonVi, DmTramQuanLy, DmTinhThanhPho,';
PRINT N'             Phao, LichSuHoatDongPhao, LichSuBaoTri, LichSuThayDoiThietBi (9 bảng)';
PRINT N'   Indexes : 16 indexes';
PRINT N'   SP      : sp_LayViTriPhaoBH_TheoTuyen, sp_ValidateThemHoatDongPhao,';
PRINT N'             sp_ThemHoatDongPhao, sp_ThuHoiPhao, sp_ChuyenPhaoSangViTriMoi,';
PRINT N'             sp_ThemLichSuBaoTri, sp_ThemLichSuThayDoiThietBi (7 SP)';
PRINT N'   Functions: fn_LayPhaoDangOViTriTheoNgay, fn_LayTrangThaiPhaoTheoNam (2)';
PRINT N'   Views   : vw_TrangThaiPhaoHienTai, vw_BaoCaoPhaoTheoLoai (2)';
PRINT N'';
PRINT N'📋 Thay đổi so với v1.0:';
PRINT N'   + DmDonVi  – Đơn vị quản lý/vận hành';
PRINT N'   + DmTramQuanLy – Trạm quản lý báo hiệu';
PRINT N'   + DmTinhThanhPho – Tỉnh/Thành phố';
PRINT N'   + Phao.ThoiGianSuDung, ThoiDiemThayTha, ThoiDiemSuaChuaGanNhat';
PRINT N'   + Phao.TramQuanLyId, TinhThanhPhoId, DonViQuanLyId, DonViVanHanhId';
PRINT N'   + Phao.SoQuyetDinhTang, NgayQuyetDinhTang, DienTich';
PRINT N'   + Phao.Den_ChieuCaoTamSangHaiDo, Den_SoQuyetDinhTang';
PRINT N'   + View vw_TrangThaiPhaoHienTai mở rộng đầy đủ cột';
