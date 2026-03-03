-- =================================================================
-- VMS BUOY MODULE v1.2 - ADVANCED SEED DATA GENERATOR (PRODUCTION-LEVEL)
-- Chức năng: Tạo 141 phao, 191 vị trí, phân bổ chuẩn 14 năm (2012-2026)
-- Tỷ lệ trạng thái: 60% Trên luồng, 15% Sửa chữa, 10% Thu hồi, 10% Cho thuê, 5% Mất dấu
-- =================================================================

SET NOCOUNT ON;
GO

-- =================================================================
-- 1. XÓA & RESET DỮ LIỆU ĐỂ TRÁNH TRÙNG LẶP (RESET IDENTITIES)
-- =================================================================
PRINT N'Đang dọn dẹp dữ liệu cũ...';
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
DBCC CHECKIDENT ('Phao', RESEED, 0);
DBCC CHECKIDENT ('DmViTriPhaoBH', RESEED, 0);
DBCC CHECKIDENT ('DmTuyenLuong', RESEED, 0);
DBCC CHECKIDENT ('DmTramQuanLy', RESEED, 0);
DBCC CHECKIDENT ('DmTinhThanhPho', RESEED, 0);
DBCC CHECKIDENT ('DmDonVi', RESEED, 0);
GO

-- =================================================================
-- 2. TẠO DANH MỤC CƠ BẢN (Đơn vị, Tỉnh thành, Trạm)
-- =================================================================
PRINT N'Đang tạo Danh mục Cơ bản...';
SET IDENTITY_INSERT DmDonVi ON;
INSERT INTO DmDonVi (Id, MaDonVi, TenDonVi, LoaiDonVi, ThuTuHienThi, NguoiTao)
VALUES 
(1, N'BĐANHNTB', N'Công ty bảo đảm an toàn hàng hải Nam Trung Bộ', N'Công ty', 1, N'SystemAdmin'),
(2, N'BĐANHPN', N'Công ty bảo đảm an toàn hàng hải Miền Nam', N'Công ty', 2, N'SystemAdmin');
SET IDENTITY_INSERT DmDonVi OFF;

SET IDENTITY_INSERT DmTinhThanhPho ON;
INSERT INTO DmTinhThanhPho (Id, MaTinh, TenTinh, ThuTuHienThi, NguoiTao)
VALUES (1, N'QNH', N'Quảng Ngãi', 1, N'SystemAdmin'), (2, N'BD', N'Bình Định', 2, N'SystemAdmin');
SET IDENTITY_INSERT DmTinhThanhPho OFF;

SET IDENTITY_INSERT DmTramQuanLy ON;
INSERT INTO DmTramQuanLy (Id, MaTram, TenTram, DonViChuQuanId, ThuTuHienThi, NguoiTao)
VALUES (1, N'TQBHLHH_QN', N'Trạm QL báo hiệu luồng Quy Nhơn', 1, 1, N'SystemAdmin');
SET IDENTITY_INSERT DmTramQuanLy OFF;
GO

-- =================================================================
-- 3. TẠO 10 TUYẾN LUỒNG & 191 VỊ TRÍ PHAO (141 Đang Dùng + 50 Dư)
-- =================================================================
PRINT N'Đang tạo 10 Tuyến luồng và 191 Vị trí phao...';
DECLARE @t INT = 1;
WHILE @t <= 10
BEGIN
    INSERT INTO DmTuyenLuong (MaTuyen, TenTuyen, ThuTuHienThi, NguoiTao)
    VALUES (N'TUYEN_' + CAST(@t AS NVARCHAR), N'Tuyến luồng số ' + CAST(@t AS NVARCHAR), @t, N'SystemAdmin');
    SET @t = @t + 1;
END;

DECLARE @v INT = 1;
WHILE @v <= 191
BEGIN
    DECLARE @TuyenId INT = (@v % 10) + 1;
    INSERT INTO DmViTriPhaoBH (TuyenLuongId, SoViTri, MaPhaoBH, ToaDoThietKe, MoTa, ThuTuHienThi, NguoiTao)
    VALUES (
        @TuyenId, 
        CAST(@v AS NVARCHAR), 
        N'V' + CAST(@v AS NVARCHAR) + N'-T' + CAST(@TuyenId AS NVARCHAR), 
        CAST(10 + (@v * 0.05) AS NVARCHAR) + N'°N ' + CAST(108 + (@v * 0.05) AS NVARCHAR) + N'°E', 
        N'Vị trí phao tự sinh số ' + CAST(@v AS NVARCHAR), 
        @v, 
        N'SystemAdmin'
    );
    SET @v = @v + 1;
END;
GO

-- =================================================================
-- 4. TẠO 141 PHAO CHỦ & VÒNG ĐỜI LỊCH SỬ 14 NĂM (2012 - 2026)
-- =================================================================
PRINT N'Đang tạo 141 Phao và sinh Lịch sử hoạt động 14 năm...';
DECLARE @PhaoId INT = 1;

WHILE @PhaoId <= 141
BEGIN
    -- 4.1. Khởi tạo Phao
    INSERT INTO Phao (
        KyHieuTaiSan, MaPhaoDayDu, TenPhao, SoPhaoHienTai,
        DuongKinhPhao, ChieuCaoToanBo, HinhDang, VatLieu, MauSac,
        TramQuanLyId, TinhThanhPhoId, DonViQuanLyId, DonViVanHanhId,
        ThoiGianSuDung, TrangThaiHienTai, NguoiTao
    )
    VALUES (
        N'KCHT' + CAST(40000 + @PhaoId AS NVARCHAR), 
        N'P' + CAST(@PhaoId AS NVARCHAR) + N'.2024', 
        N'Phao tự động số ' + CAST(@PhaoId AS NVARCHAR), 
        @PhaoId,
        2.4, 4.5, N'Tháp', N'Thép', CASE WHEN @PhaoId % 2 = 0 THEN N'Đỏ' ELSE N'Xanh' END,
        1, 1, 1, 1,
        14, N'KHOI_TAO', N'SystemAdmin'
    );

    -- 4.2. Tính toán trạng thái mục tiêu (End State) để đạt đúng Tỷ lệ
    -- 141 * 60% = 85 (Trên luồng)
    -- 141 * 15% = 21 (Sửa chữa) -> đến 106
    -- 141 * 10% = 14 (Thu hồi) -> đến 120
    -- 141 * 10% = 14 (Cho thuê) -> đến 134
    -- 141 * 5% =  7 (Mất dấu) -> đến 141
    DECLARE @TargetStatus NVARCHAR(50);
    IF @PhaoId <= 85 SET @TargetStatus = N'TREN_LUONG';
    ELSE IF @PhaoId <= 106 SET @TargetStatus = N'SUA_CHUA';
    ELSE IF @PhaoId <= 120 SET @TargetStatus = N'THU_HOI';
    ELSE IF @PhaoId <= 134 SET @TargetStatus = N'CHO_THUE';
    ELSE SET @TargetStatus = N'MAT_DAU';

    -- 4.3. Sinh chuỗi sự kiện lịch sử từ 2012 đến 2026
    DECLARE @CurrentYear INT = 2012;
    DECLARE @IsTrenLuong BIT = 1;
    DECLARE @CurrentViTri INT = @PhaoId; -- Mỗi phao lấy 1 vị trí ban đầu (1 đến 141)

    WHILE @CurrentYear <= 2026
    BEGIN
        DECLARE @RandEvent INT = ABS(CHECKSUM(NEWID())) % 100;
        DECLARE @NextStatus NVARCHAR(50);
        
        -- Tránh lỗi ngày > 28
        DECLARE @Thang INT = (ABS(CHECKSUM(NEWID())) % 12) + 1;
        DECLARE @Ngay INT = (ABS(CHECKSUM(NEWID())) % 28) + 1;
        DECLARE @NgayBatDau DATE = DATEFROMPARTS(@CurrentYear, @Thang, @Ngay);

        -- Logic chuyển trạng thái ngẫu nhiên nhưng hợp lý
        IF @IsTrenLuong = 1
        BEGIN
            IF @RandEvent < 30 SET @NextStatus = N'SUA_CHUA';
            ELSE IF @RandEvent < 60 SET @NextStatus = N'TREN_LUONG'; -- Ghi nhận là "Chuyển vị trí/Tuyến"
            ELSE IF @RandEvent < 80 SET @NextStatus = N'THU_HOI';
            ELSE IF @RandEvent < 95 SET @NextStatus = N'CHO_THUE';
            ELSE SET @NextStatus = N'MAT_DAU';
        END
        ELSE
        BEGIN
            -- Nếu đang ở bãi/kho, tỷ lệ quay lại luồng cao
            IF @RandEvent < 70 SET @NextStatus = N'TREN_LUONG';
            ELSE SET @NextStatus = N'CHO_THUE';
        END

        -- NẾU LÀ NĂM CUỐI CÙNG HOẶC VƯỢT QUÁ -> Ép về trạng thái Target theo tỷ lệ yêu cầu
        IF @CurrentYear >= 2025
        BEGIN
            SET @NextStatus = @TargetStatus;
            SET @CurrentYear = 2026; -- Đảm bảo thoát vòng lặp
        END

        -- Xử lý Vị trí
        DECLARE @ViTriId INT = NULL;
        DECLARE @MaTuyen NVARCHAR(50) = NULL;
        
        IF @NextStatus = N'TREN_LUONG'
        BEGIN
            -- 60% cơ hội chuyển vị trí mới khi hoạt động lại
            IF ABS(CHECKSUM(NEWID())) % 100 < 60
            BEGIN
                -- Chỉ random trong 191 vị trí
                SET @CurrentViTri = (ABS(CHECKSUM(NEWID())) % 191) + 1;
            END
            SET @ViTriId = @CurrentViTri;
            SET @MaTuyen = N'TUYEN_' + CAST(((@CurrentViTri % 10) + 1) AS NVARCHAR);
            SET @IsTrenLuong = 1;
        END
        ELSE
        BEGIN
            SET @IsTrenLuong = 0;
        END

        -- Chèn Lịch sử
        INSERT INTO LichSuHoatDongPhao (
            PhaoId, Nam, NgayBatDau, LoaiTrangThai, MoTaTrangThai, 
            ViTriPhaoBHId, MaPhaoBH, MaTuyenLuong, KinhDo, ViDo, GhiChu, NguoiTao
        )
        VALUES (
            @PhaoId, @CurrentYear, @NgayBatDau, @NextStatus, 
            N'Cập nhật trạng thái: ' + @NextStatus, 
            @ViTriId,
            CASE WHEN @ViTriId IS NOT NULL THEN N'V' + CAST(@ViTriId AS NVARCHAR) ELSE NULL END,
            @MaTuyen,
            109.0 + (@CurrentViTri * 0.01), 13.0 + (@CurrentViTri * 0.01),
            N'Dữ liệu tự động sinh năm ' + CAST(@CurrentYear AS NVARCHAR), 
            N'SystemAdmin'
        );

        -- BẮT BUỘC: Tiến lên 1 hoặc 2 năm để ĐẢM BẢO KHÔNG TRÙNG NĂM THAY ĐỔI
        SET @CurrentYear = @CurrentYear + (ABS(CHECKSUM(NEWID())) % 2) + 1;
    END

    SET @PhaoId = @PhaoId + 1;
END;
GO

-- =================================================================
-- 5. ĐỒNG BỘ TRẠNG THÁI CUỐI CÙNG LÊN BẢNG PHAO
-- =================================================================
PRINT N'Đang đồng bộ trạng thái thực tế lên bảng Phao...';
UPDATE P
SET 
    TrangThaiHienTai = LS.LoaiTrangThai,
    ThoiDiemThayTha = LS.NgayBatDau
FROM Phao P
CROSS APPLY (
    SELECT TOP 1 LoaiTrangThai, NgayBatDau
    FROM LichSuHoatDongPhao
    WHERE PhaoId = P.Id
    ORDER BY NgayBatDau DESC
) LS;
GO

PRINT N'✅ Đã khởi tạo thành công 141 phao và 191 vị trí.';
PRINT N'✅ Lịch sử hoạt động được sinh hoàn hảo từ 2012 -> 2026.';
PRINT N'✅ Đã chuẩn hóa chính xác tỷ lệ phân bổ trạng thái: Trên luồng (60%), Sửa chữa (15%), Thu hồi (10%), Cho thuê (10%), Mất dấu (5%).';
