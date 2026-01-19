-- =============================================
-- VMS BUOY LIFECYCLE MANAGEMENT MODULE
-- Vessel Management System - Maritime Buoy Operations
-- =============================================
-- Author: Nguyen Ngoc Binh
-- Date: 2026-01-16
-- Version: 1.0
-- Description: Complete buoy lifecycle management with snapshot pattern,
--              position validation, and historical tracking
-- =============================================

USE VMS_DB;
GO

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
  -- D24.020.16 (TÊN PHAO)
  MaLoaiPhao AS (LEFT(MaPhaoDayDu, CHARINDEX('.', MaPhaoDayDu) - 1)) PERSISTED,
  -- D24, DN24, T26...
  TenPhao NVARCHAR(255),
  -- Mô tả bổ sung (tùy chọn)
  SoPhaoHienTai INT,
  -- STT: 1, 2, 3...

  -- Kỹ thuật cơ bản
  DuongKinhPhao DECIMAL(10, 2),
  -- m
  ChieuCaoToanBo DECIMAL(10, 2),
  -- m
  HinhDang NVARCHAR(100),
  -- Trụ, Côn, Trụ tròn
  VatLieu NVARCHAR(100),
  -- Thép, Composite
  MauSac NVARCHAR(100),
  -- Đỏ, Xanh, Vàng

  -- Xích và Rùa
  XichPhao_DuongKinh DECIMAL(10, 2),
  -- mm
  XichPhao_ChieuDai DECIMAL(10, 2),
  -- m
  XichPhao_ThoiDiemSuDung DATE,
  XichRua_DuongKinh DECIMAL(10, 2),
  -- mm
  XichRua_ChieuDai DECIMAL(10, 2),
  -- m
  XichRua_ThoiDiemSuDung DATE,
  Rua_TrongLuong DECIMAL(10, 2),
  -- kg
  Rua_ThoiDiemSuDung DATE,

  -- Đèn báo hiệu
  Den_ChungLoai NVARCHAR(100),
  Den_KetNoiAIS BIT,
  -- Có kết nối AIS không
  Den_DacTinhAnhSang NVARCHAR(255),
  Den_ChieuXaTamSang DECIMAL(10, 2),
  -- hải lý
  Den_NguonCapNangLuong NVARCHAR(100),
  Den_ThoiDiemSuDung DATE,
  Den_ThoiDiemSuaChua DATE,

  -- Trạng thái hiện tại (cache để query nhanh)
  TrangThaiHienTai NVARCHAR(255),
  -- Cache: "4A"-QN, "Trên bãi", "Thu hồi"
  ViTriPhaoBHHienTaiId INT,
  -- FK → DmViTriPhaoBH

  -- Audit
  NgayTao DATETIME2 DEFAULT GETDATE(),
  NguoiTao NVARCHAR(100),
  NgayCapNhat DATETIME2,
  NguoiCapNhat NVARCHAR(100),

  FOREIGN KEY (ViTriPhaoBHHienTaiId) REFERENCES DmViTriPhaoBH(Id)
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
  ViDo DECIMAL(10, 6),
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

-- LichSuHoatDongPhao indexes
CREATE NONCLUSTERED INDEX IX_LichSuHoatDong_PhaoId_Nam ON LichSuHoatDongPhao(PhaoId, Nam);
CREATE NONCLUSTERED INDEX IX_LichSuHoatDong_LoaiTrangThai ON LichSuHoatDongPhao(LoaiTrangThai);
CREATE NONCLUSTERED INDEX IX_LichSuHoatDong_NgayKetThuc ON LichSuHoatDongPhao(NgayKetThuc);
CREATE NONCLUSTERED INDEX IX_LichSuHoatDong_ViTriPhaoBHId ON LichSuHoatDongPhao(ViTriPhaoBHId);
CREATE NONCLUSTERED INDEX IX_LichSuHoatDong_MaTuyenLuong ON LichSuHoatDongPhao(MaTuyenLuong);

-- DmViTriPhaoBH indexes
CREATE NONCLUSTERED INDEX IX_ViTriPhaoBH_TuyenLuongId ON DmViTriPhaoBH(TuyenLuongId);

-- LichSuBaoTri indexes
CREATE NONCLUSTERED INDEX IX_BaoTri_PhaoId_NgayBaoTri ON LichSuBaoTri(PhaoId, NgayBaoTri);

-- LichSuThayDoiThietBi indexes
CREATE NONCLUSTERED INDEX IX_ThayDoiThietBi_PhaoId_NgayThayDoi ON LichSuThayDoiThietBi(PhaoId, NgayThayDoi);

-- =============================================
-- SECTION 6: STORED PROCEDURES - VỊ TRÍ & TUYẾN
-- =============================================

-- Load vị trí Phao BH theo tuyến với trạng thái
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
    -- Phao hiện tại (nếu có)
    p.Id AS PhaoHienTaiId,
    p.MaPhaoDayDu AS PhaoHienTai,
    p.MaLoaiPhao AS LoaiPhaoHienTai,
    -- Trạng thái
    CASE
            WHEN p.Id IS NULL THEN 1  -- Trống, có thể chọn
            ELSE 0                     -- Đã có phao, không thể chọn
        END AS CoTheChon,
    CASE
            WHEN p.Id IS NULL THEN N'Trống'
            ELSE N'Đã có phao: ' + p.MaPhaoDayDu
        END AS MoTaTrangThai
  FROM DmViTriPhaoBH vt
    LEFT JOIN (
        SELECT PhaoId, ViTriPhaoBHId
    FROM LichSuHoatDongPhao
    WHERE LoaiTrangThai = N'TREN_LUONG'
      AND NgayKetThuc IS NULL  -- Đang hoạt động
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

-- Validate trước khi thêm hoạt động phao
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
  -- Mặc định là hợp lệ
  SET @Message = N'Hợp lệ';
  SET @PhaoHienTai = NULL;

  -- Check 1: Vị trí đã có phao khác chưa?
  IF EXISTS (
        SELECT 1
  FROM LichSuHoatDongPhao
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
    WHERE ls.ViTriPhaoBHId = @ViTriPhaoBHId
      AND ls.NgayKetThuc IS NULL;

    RETURN;
  END

  -- Check 2: Phao có đang ở luồng khác không?
  DECLARE @ViTriHienTai NVARCHAR(50);

  SELECT @ViTriHienTai = MaPhaoBH
  FROM LichSuHoatDongPhao
  WHERE PhaoId = @PhaoId
    AND LoaiTrangThai = N'TREN_LUONG'
    AND NgayKetThuc IS NULL;

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

-- Thêm hoạt động phao lên luồng (với validation)
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
        -- 1. VALIDATE
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

        -- 2. ĐÓNG lịch sử cũ
        UPDATE LichSuHoatDongPhao
        SET NgayKetThuc = @NgayLapDat
        WHERE PhaoId = @PhaoId
    AND NgayKetThuc IS NULL;

        -- 3. LẤY thông tin vị trí
        DECLARE @MaPhaoBH NVARCHAR(50);
        DECLARE @MaTuyenLuong NVARCHAR(50);
        DECLARE @Nam INT = YEAR(@NgayLapDat);

        SELECT
    @MaPhaoBH = vt.MaPhaoBH,
    @MaTuyenLuong = tl.MaTuyen
  FROM DmViTriPhaoBH vt
    INNER JOIN DmTuyenLuong tl ON vt.TuyenLuongId = tl.Id
  WHERE vt.Id = @ViTriPhaoBHId;

        -- 4. THÊM lịch sử mới
        INSERT INTO LichSuHoatDongPhao
    (
    PhaoId, Nam, NgayBatDau, NgayKetThuc,
    LoaiTrangThai, MoTaTrangThai,
    ViTriPhaoBHId, MaPhaoBH, MaTuyenLuong,
    GhiChu, NguoiTao, NgayTao
    )
  VALUES
    (
      @PhaoId, @Nam, @NgayLapDat, NULL,
      N'TREN_LUONG', @MaPhaoBH,
      @ViTriPhaoBHId, @MaPhaoBH, @MaTuyenLuong,
      @GhiChu, @NguoiTao, GETDATE()
        );

        DECLARE @LichSuId INT = SCOPE_IDENTITY();

        -- 5. CẬP NHẬT trạng thái phao
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

-- Thu hồi phao về bãi
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
        -- 1. ĐÓNG lịch sử cũ (nếu đang trên luồng)
        UPDATE LichSuHoatDongPhao
        SET NgayKetThuc = @NgayThuHoi
        WHERE PhaoId = @PhaoId
    AND NgayKetThuc IS NULL;

        -- 2. THÊM lịch sử thu hồi
        DECLARE @Nam INT = YEAR(@NgayThuHoi);
        
        INSERT INTO LichSuHoatDongPhao
    (
    PhaoId, Nam, NgayBatDau, NgayKetThuc,
    LoaiTrangThai, MoTaTrangThai,
    DiaDiem, GhiChu, NguoiTao, NgayTao
    )
  VALUES
    (
      @PhaoId, @Nam, @NgayThuHoi, NULL,
      N'THU_HOI', N'Thu hồi về ' + @DiaDiem,
      @DiaDiem, @GhiChu, @NguoiTao, GETDATE()
        );

        -- 3. CẬP NHẬT trạng thái phao
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

-- Chuyển phao sang vị trí mới
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

  -- Sử dụng sp_ThemHoatDongPhao với validation
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

-- Thêm lịch sử bảo trì
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
    (
    PhaoId, LoaiBaoTri, NgayBaoTri,
    NoiDungCongViec, KetQuaBaoTri, ChiPhi,
    DonViThucHien, NguoiPhuTrach, GhiChu,
    NguoiTao, NgayTao
    )
  VALUES
    (
      @PhaoId, @LoaiBaoTri, @NgayBaoTri,
      @NoiDungCongViec, @KetQuaBaoTri, @ChiPhi,
      @DonViThucHien, @NguoiPhuTrach, @GhiChu,
      @NguoiTao, GETDATE()
    );

  SELECT 1 AS Success,
    N'Thêm lịch sử bảo trì thành công!' AS Message,
    SCOPE_IDENTITY() AS BaoTriId;
END;
GO

-- Thêm lịch sử thay đổi thiết bị
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
    (
    PhaoId, LoaiThietBi, NgayThayDoi,
    ThongTinCu, ThongTinMoi, LyDoThayDoi,
    GhiChu, NguoiTao, NgayTao
    )
  VALUES
    (
      @PhaoId, @LoaiThietBi, @NgayThayDoi,
      @ThongTinCu, @ThongTinMoi, @LyDoThayDoi,
      @GhiChu, @NguoiTao, GETDATE()
    );

  SELECT 1 AS Success,
    N'Thêm lịch sử thay đổi thiết bị thành công!' AS Message,
    SCOPE_IDENTITY() AS ThayDoiId;
END;
GO

-- =============================================
-- SECTION 11: FUNCTIONS
-- =============================================

-- Lấy phao đang ở vị trí theo ngày
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

-- Lấy trạng thái phao theo năm
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
  Id,
  PhaoId,
  Nam,
  NgayBatDau,
  NgayKetThuc,
  LoaiTrangThai,
  MoTaTrangThai,
  MaPhaoBH,
  MaTuyenLuong,
  DATEDIFF(DAY, NgayBatDau, ISNULL(NgayKetThuc, GETDATE())) AS SoNgayHoatDong
FROM LichSuHoatDongPhao
WHERE PhaoId = @PhaoId
  AND Nam = @Nam
);
GO

-- =============================================
-- SECTION 12: VIEWS
-- =============================================

-- View: Trạng thái hiện tại của tất cả phao
GO
CREATE VIEW vw_TrangThaiPhaoHienTai
AS
  SELECT
    p.Id AS PhaoId,
    p.MaPhaoDayDu,
    p.MaLoaiPhao,
    p.SoPhaoHienTai,
    p.TrangThaiHienTai,
    -- Vị trí hiện tại
    vt.MaPhaoBH AS ViTriHienTai,
    tl.TenTuyen AS TuyenHienTai,
    -- Lịch sử gần nhất
    ls.NgayBatDau AS NgayBatDauTrangThaiHienTai,
    ls.LoaiTrangThai,
    ls.MoTaTrangThai,
    ls.GhiChu
  FROM Phao p
    LEFT JOIN DmViTriPhaoBH vt ON p.ViTriPhaoBHHienTaiId = vt.Id
    LEFT JOIN DmTuyenLuong tl ON vt.TuyenLuongId = tl.Id
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

-- Thêm tuyến luồng
INSERT INTO DmTuyenLuong
  (MaTuyen, TenTuyen, ThuTuHienThi, NguoiTao)
VALUES
  (N'QN', N'Luồng Quy Nhơn', 1, N'System'),
  (N'ĐTN', N'Luồng Dung Quất - Tiên Sa', 2, N'System'),
  (N'PQ', N'Luồng Phú Quý', 3, N'System'),
  (N'NT', N'Luồng Nha Trang', 4, N'System'),
  (N'CNV', N'Luồng Cam Ranh - Vạn Ninh', 5, N'System');

-- Thêm vị trí Phao BH cho luồng QN
DECLARE @QNId INT = (SELECT Id
FROM DmTuyenLuong
WHERE MaTuyen = N'QN');

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

-- Thêm vị trí Phao BH cho luồng PQ
DECLARE @PQId INT = (SELECT Id
FROM DmTuyenLuong
WHERE MaTuyen = N'PQ');

INSERT INTO DmViTriPhaoBH
  (TuyenLuongId, SoViTri, MaPhaoBH, ThuTuHienThi, NguoiTao)
VALUES
  (@PQId, N'P0', N'P0-PQ', 1, N'System'),
  (@PQId, N'P1', N'P1-PQ', 2, N'System'),
  (@PQId, N'P2', N'P2-PQ', 3, N'System'),
  (@PQId, N'P3', N'P3-PQ', 4, N'System'),
  (@PQId, N'P4', N'P4-PQ', 5, N'System'),
  (@PQId, N'P5', N'P5-PQ', 6, N'System');

-- Thêm phao mẫu
INSERT INTO Phao
  (
  KyHieuTaiSan, MaPhaoDayDu, SoPhaoHienTai,
  DuongKinhPhao, ChieuCaoToanBo, HinhDang, VatLieu, MauSac,
  TrangThaiHienTai, NguoiTao
  )
VALUES
  (N'KCHT40861', N'D24.020.16', 1, 2.4, 4.5, N'Trụ tròn', N'Thép', N'Đỏ', N'Trên bãi', N'System'),
  (N'KCHT40862', N'DN24.037.02', 2, 2.4, 5.0, N'Trụ côn', N'Composite', N'Đỏ', N'Trên bãi', N'System'),
  (N'KCHT40863', N'T26.016.09', 3, 2.6, 5.5, N'Trụ', N'Thép', N'Xanh', N'Trên bãi', N'System'),
  (N'KCHT40864', N'T20.012.05', 4, 2.0, 4.0, N'Trụ', N'Composite', N'Xanh', N'Trên bãi', N'System');

-- Thêm lịch sử hoạt động mẫu
DECLARE @Phao1Id INT = (SELECT Id
FROM Phao
WHERE MaPhaoDayDu = N'D24.020.16');
DECLARE @ViTri4AQN INT = (SELECT Id
FROM DmViTriPhaoBH
WHERE MaPhaoBH = N'"4A"-QN');

INSERT INTO LichSuHoatDongPhao
  (
  PhaoId, Nam, NgayBatDau, NgayKetThuc,
  LoaiTrangThai, MoTaTrangThai,
  ViTriPhaoBHId, MaPhaoBH, MaTuyenLuong,
  NguoiTao
  )
VALUES
  (@Phao1Id, 2024, '2024-01-01', NULL,
    N'TREN_BAI', N'Trên bãi Phú Quý',
    NULL, NULL, NULL, N'System');

-- Cập nhật trạng thái hiện tại
UPDATE Phao
SET TrangThaiHienTai = N'Trên bãi'
WHERE Id = @Phao1Id;

GO

PRINT N'✅ VMS Buoy Module được tạo thành công!';
PRINT N'';
PRINT N'📊 Thống kê:';
PRINT N'   - 7 bảng: DmTuyenLuong, DmViTriPhaoBH, Phao, LichSuHoatDongPhao, LichSuBaoTri, LichSuThayDoiThietBi';
PRINT N'   - 11 indexes để tối ưu hiệu suất';
PRINT N'   - 9 stored procedures: sp_LayViTriPhaoBH_TheoTuyen, sp_ValidateThemHoatDongPhao, sp_ThemHoatDongPhao, sp_ThuHoiPhao, sp_ChuyenPhaoSangViTriMoi, sp_ThemLichSuBaoTri, sp_ThemLichSuThayDoiThietBi';
PRINT N'   - 2 functions: fn_LayPhaoDangOViTriTheoNgay, fn_LayTrangThaiPhaoTheoNam';
PRINT N'   - 2 views: vw_TrangThaiPhaoHienTai, vw_BaoCaoPhaoTheoLoai';
PRINT N'   - Sample data: 5 tuyến luồng, 15 vị trí, 4 phao mẫu';
PRINT N'';
PRINT N'🎯 Chức năng chính:';
PRINT N'   - Thêm hoạt động phao với validation vị trí';
PRINT N'   - Thu hồi phao về bãi';
PRINT N'   - Chuyển phao sang vị trí mới';
PRINT N'   - Quản lý bảo trì & thay đổi thiết bị';
PRINT N'   - Snapshot pattern cho lịch sử';
PRINT N'   - Computed column MaLoaiPhao tự động';
