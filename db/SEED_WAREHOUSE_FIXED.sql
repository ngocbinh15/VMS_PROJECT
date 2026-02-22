-- =============================================
-- SEED DATA FOR WAREHOUSE MODULE (FIXED VERSION)
-- Chỉ thêm: Kho, Nhóm vật liệu, Đơn vị tính, Vật liệu, Tồn kho
-- Date: 2026-01-27
-- =============================================

USE VMS_DB;
GO

-- =============================================
-- 1. NHÓM VẬT LIỆU (MATERIAL GROUPS)
-- =============================================
INSERT INTO NhomVatLieu
  (MaNhom, TenNhom, MoTa)
VALUES
  ('NHIEN_LIEU', N'NHIÊN LIỆU', N'Nhóm nhiên liệu'),
  ('VAT_TU_KHAC', N'VẬT TƯ KHÁC', N'Nhóm vật tư khác'),
  ('VAT_TU_PHAO', N'VẬT TƯ CẤP THEO PHAO', N'Nhóm vật tư cấp theo phao đóng mới'),
  ('VAT_TU_TP', N'VẬT TƯ THÀNH PHẨM', N'Nhóm vật tư thành phẩm');
GO

-- =============================================
-- 2. ĐƠN VỊ TÍNH (UNITS)
-- =============================================
INSERT INTO DonViTinh
  (MaDonVi, TenDonVi)
VALUES
  ('KG', N'kg'),
  ('CAI', N'Cái'),
  ('TAM', N'tấm'),
  ('BO', N'Bộ'),
  ('QUA', N'Quả'),
  ('BINH', N'Bình'),
  ('M', N'Mét'),
  ('L', N'Lít');
GO

-- =============================================
-- 3. KHO (30 WAREHOUSES)
-- =============================================
-- Kho mẹ
INSERT INTO Kho
  (MaKho, TenKho, LoaiKho, KhoMeId, DiaChi, TrangThai)
VALUES
  ('KHO_ME', N'Kho Tổng', 'KHO_ME', NULL, N'Trụ sở chính - TP.HCM', N'Hoạt động');
GO

-- Kho con
INSERT INTO Kho
  (MaKho, TenKho, LoaiKho, KhoMeId, DiaChi, TrangThai)
SELECT MaKho, TenKho, 'KHO_CON', (SELECT Id
  FROM Kho
  WHERE MaKho = 'KHO_ME'), DiaChi, N'Hoạt động'
FROM (VALUES
    ('KHO_01', N'Kho Chi nhánh 1', N'Quận 1 - TP.HCM'),
    ('KHO_02', N'Kho Chi nhánh 2', N'Quận 2 - TP.HCM'),
    ('KHO_03', N'Kho Chi nhánh 3', N'Quận 3 - TP.HCM'),
    ('KHO_04', N'Kho Chi nhánh 4', N'Quận 4 - TP.HCM'),
    ('KHO_05', N'Kho Chi nhánh 5', N'Quận 5 - TP.HCM'),
    ('KHO_06', N'Kho Chi nhánh 6', N'Quận 6 - TP.HCM'),
    ('KHO_07', N'Kho Chi nhánh 7', N'Quận 7 - TP.HCM'),
    ('KHO_08', N'Kho Chi nhánh 8', N'Quận 8 - TP.HCM'),
    ('KHO_09', N'Kho Chi nhánh 9', N'Quận 9 - TP.HCM'),
    ('KHO_10', N'Kho Thủ Đức', N'Thủ Đức - TP.HCM'),
    ('KHO_11', N'Kho Bình Thạnh', N'Bình Thạnh - TP.HCM'),
    ('KHO_12', N'Kho Tân Bình', N'Tân Bình - TP.HCM'),
    ('KHO_13', N'Kho Phú Nhuận', N'Phú Nhuận - TP.HCM'),
    ('KHO_14', N'Kho Gò Vấp', N'Gò Vấp - TP.HCM'),
    ('KHO_15', N'Kho Bình Tân', N'Bình Tân - TP.HCM'),
    ('KHO_16', N'Kho Tân Phú', N'Tân Phú - TP.HCM'),
    ('KHO_17', N'Kho Cần Thơ', N'Cần Thơ'),
    ('KHO_18', N'Kho Đà Nẵng', N'Đà Nẵng'),
    ('KHO_19', N'Kho Hà Nội', N'Hà Nội'),
    ('KHO_20', N'Kho Hải Phòng', N'Hải Phòng'),
    ('KHO_21', N'Kho Nha Trang', N'Nha Trang - Khánh Hòa'),
    ('KHO_22', N'Kho Vũng Tàu', N'Vũng Tàu - Bà Rịa'),
    ('KHO_23', N'Kho Quy Nhơn', N'Quy Nhơn - Bình Định'),
    ('KHO_24', N'Kho Huế', N'Huế - Thừa Thiên Huế'),
    ('KHO_25', N'Kho Quảng Nam', N'Quảng Nam'),
    ('KHO_26', N'Kho Bình Dương', N'Bình Dương'),
    ('KHO_27', N'Kho Đồng Nai', N'Đồng Nai'),
    ('KHO_28', N'Kho Long An', N'Long An'),
    ('KHO_29', N'Kho Tiền Giang', N'Tiền Giang')
) AS KhoCon(MaKho, TenKho, DiaChi);
GO

-- =============================================
-- 4. VẬT LIỆU (85 MATERIALS)
-- Dùng INSERT SELECT để lấy ID từ bảng NhomVatLieu và DonViTinh
-- =============================================

-- NHÓM 1: NHIÊN LIỆU (3 items)
INSERT INTO VatLieu
  (MaVatLieu, TenVatLieu, NhomVatLieuId, DonViTinhId, TrangThai)
SELECT MaVatLieu, TenVatLieu,
  (SELECT Id
  FROM NhomVatLieu
  WHERE MaNhom = 'NHIEN_LIEU'),
  (SELECT Id
  FROM DonViTinh
  WHERE MaDonVi = 'KG'),
  N'Đang sử dụng'
FROM (VALUES
    ('VT000001', N'Xăng'),
    ('VT000002', N'Diezel'),
    ('VT000003', N'Nhớt HD')
) AS NhienLieu(MaVatLieu, TenVatLieu);
GO

-- NHÓM 2: VẬT TƯ KHÁC - Phần 1: Tấm pin, Ma ní, Xích (đơn vị KG, CAI, TAM)
INSERT INTO VatLieu
  (MaVatLieu, TenVatLieu, NhomVatLieuId, DonViTinhId, TrangThai)
SELECT MaVatLieu, TenVatLieu,
  (SELECT Id
  FROM NhomVatLieu
  WHERE MaNhom = 'VAT_TU_KHAC'),
  (SELECT Id
  FROM DonViTinh
  WHERE MaDonVi = DonVi),
  N'Đang sử dụng'
FROM (VALUES
    ('VT000140', N'Tấm pin năng lượng mặt trời 12V-45W', 'TAM'),
    ('VT000039', N'Ma ní 42 (Ma ní nối, neo)', 'CAI'),
    ('VT000040', N'Ma ní 45 (Ma ní nối, neo)', 'CAI'),
    ('VT000041', N'Xích có ngáng cấp 2 f34', 'KG'),
    ('VT000042', N'Xích có ngáng cấp 2 phi 36', 'KG'),
    ('VT000043', N'Xích có ngáng cấp 2 phi 38', 'KG'),
    ('VT000044', N'Xích có ngáng cấp 2 phi 40', 'KG'),
    ('VT000045', N'Vòng nối phi 50 (Chi tiết liên kết)', 'CAI'),
    ('VT000046', N'Vòng nối phi 55 (Chi Tiết Liên Kết)', 'CAI'),
    ('VT000047', N'Con quay phi 45 (Chi tiết liên kết)', 'CAI'),
    ('VT000048', N'Mắt may 42 (Mắt Cuối)', 'CAI'),
    ('VT000049', N'Mắt may 45 (Mắt Cuối)', 'CAI'),
    ('VT000050', N'Con Quay 50 (Mắt Xoay)', 'CAI'),
    ('VT000052', N'Quang trở (nhật quang)', 'CAI'),
    ('VT000054', N'Ron nắp phao 10 ly', 'CAI'),
    ('VT000056', N'NLMT BP 350-40W', 'TAM'),
    ('VT000090', N'Pin NL- MT 12V-50W', 'TAM'),
    ('VT000095', N'Xích mạ phi 32', 'KG')
) AS VatTu(MaVatLieu, TenVatLieu, DonVi);
GO

-- NHÓM 2: VẬT TƯ KHÁC - Phần 2: Bộ điều khiển, Đèn (đơn vị BỘ)
INSERT INTO VatLieu
  (MaVatLieu, TenVatLieu, NhomVatLieuId, DonViTinhId, TrangThai)
SELECT MaVatLieu, TenVatLieu,
  (SELECT Id
  FROM NhomVatLieu
  WHERE MaNhom = 'VAT_TU_KHAC'),
  (SELECT Id
  FROM DonViTinh
  WHERE MaDonVi = 'BO'),
  N'Đang sử dụng'
FROM (VALUES
    ('VT000057', N'Bộ điều khiển nạp 60A-12V DC'),
    ('VT000058', N'Đế đuôi đèn VMS RB 400'),
    ('VT000060', N'Bộ điều khiển VMS SRB 220'),
    ('VT000061', N'Bộ truyền động đèn VMS-RB 220'),
    ('VT000063', N'Bộ motor VMS- RB 220'),
    ('VT000064', N'Đèn MS-L133-GSM led lanten'),
    ('VT000066', N'Bộ giám sát BHHH từ xa GSM'),
    ('VT000068', N'Đuôi đèn báo hiệu hàng hải (Inox 304)'),
    ('VT000069', N'Bộ đổi bóng đèn TRB - 400'),
    ('VT000081', N'Motor đèn RB 400'),
    ('VT000011', N'Bộ chớp 12v-30w-3s (0,5 +2,5)'),
    ('VT000012', N'Bộ chớp 12v Móc A-6s'),
    ('VT000013', N'Bộ chớp 12v -(2+1)-10s'),
    ('VT000014', N'Bộ chớp 12v -(6+1)-15s'),
    ('VT000015', N'Bộ chớp 12v Móc A-10s'),
    ('VT000032', N'Máy chớp 12v-30w (3+1)=12s'),
    ('VT000033', N'Máy chớp 12v-30w (0,25+0,75)=1s'),
    ('VT000037', N'Máy chớp điện tử đa năng 12V - 150W'),
    ('VT000038', N'Máy chớp điện tử đa năng 12V - 30W'),
    ('VT000089', N'Chớp điện tử đa năng 12V - 50W'),
    ('VT000035', N'Tiết chế nạp pin năng lượng mặt trời 12v - 40A'),
    ('VT000036', N'Tiết chế nạp Pin NLMT 12v-80A'),
    ('VT000086', N'Tiết chế điện tử BPR2-NGT (12V-40A)'),
    ('VT000088', N'Tiết chế điện tử BPR4-NGT (12V- 80A)')
) AS VatTuBo(MaVatLieu, TenVatLieu);
GO

-- NHÓM 2: VẬT TƯ KHÁC - Phần 3: Bóng đèn, Máy chớp (đơn vị CÁI)
INSERT INTO VatLieu
  (MaVatLieu, TenVatLieu, NhomVatLieuId, DonViTinhId, TrangThai)
SELECT MaVatLieu, TenVatLieu,
  (SELECT Id
  FROM NhomVatLieu
  WHERE MaNhom = 'VAT_TU_KHAC'),
  (SELECT Id
  FROM DonViTinh
  WHERE MaDonVi = 'CAI'),
  N'Đang sử dụng'
FROM (VALUES
    ('VT000070', N'Đèn MS - L133 led'),
    ('VT000071', N'Máy thay bóng VMS-SRB 400'),
    ('VT000072', N'Bộ truyền động và motor VMS. SRB 400'),
    ('VT000073', N'Đèn Led AECS _NM3 LED lantern'),
    ('VT000074', N'Bộ đổi bóng đèn RB400'),
    ('VT000075', N'Bộ điều khiển motor đèn RB400-2017'),
    ('VT000077', N'Bộ điều khiển motor đèn RB400-2018'),
    ('VT000079', N'Cân Phao (2,4m)'),
    ('VT000004', N'Bóng 12v-10w'),
    ('VT000005', N'Bóng HD 12v-20w'),
    ('VT000006', N'Bóng HD 12v-100w'),
    ('VT000007', N'Bóng HD 12v-5A'),
    ('VT000008', N'Bóng halogen 24v -180w'),
    ('VT000009', N'Halogen 12-35w'),
    ('VT000010', N'Bóng HD 12v-75w'),
    ('VT000016', N'Máy chớp 12v-30w (0,5+0,5+0,5+0,5+5,5)=10s'),
    ('VT000017', N'Máy chớp 12v-30w (nhóm 9) 15s'),
    ('VT000018', N'Máy chớp 12v-30w (2+1) 6s'),
    ('VT000019', N'Máy chớp 12v-30w (0,5+1+0,5+3).5s'),
    ('VT000020', N'Máy chớp 12v-30w (0,5+1) 1,5s'),
    ('VT000021', N'Máy chớp 12v-30w (0,5+0,5) 1s'),
    ('VT000022', N'Máy chớp 12v-30w (0,5+4,5) 5s'),
    ('VT000023', N'Máy chớp 12v-30w (nhóm 3). 15s'),
    ('VT000024', N'Máy chớp 12v-30w (6+1)..10s'),
    ('VT000025', N'Máy chớp 12v-30w (nhóm 9) 10s'),
    ('VT000026', N'Máy chớp 12v-30w (3+1)..10s'),
    ('VT000027', N'Máy chớp 12v-30w (nhóm 2).15s'),
    ('VT000028', N'Máy chớp 12v-30w (0,5+3,5).4s'),
    ('VT000029', N'Máy chớp 12v-30w (1+4) .5s'),
    ('VT000030', N'Máy chớp 12v-30w (0,25+0,25) 0,5s'),
    ('VT000031', N'Máy chớp 12v-30w (nhóm 3) .5s')
) AS VatTuCai(MaVatLieu, TenVatLieu);
GO

-- NHÓM 2: VẬT TƯ KHÁC - Phần 4: Rùa BTCT (đơn vị QUẢ)
INSERT INTO VatLieu
  (MaVatLieu, TenVatLieu, NhomVatLieuId, DonViTinhId, TrangThai)
VALUES
  ('VT000087', N'Rùa BTCT 09Tấn',
    (SELECT Id
    FROM NhomVatLieu
    WHERE MaNhom = 'VAT_TU_KHAC'),
    (SELECT Id
    FROM DonViTinh
    WHERE MaDonVi = 'QUA'),
    N'Đang sử dụng');
GO

-- NHÓM 2: VẬT TƯ KHÁC - Phần 5: Ắc quy (đơn vị BÌNH)
INSERT INTO VatLieu
  (MaVatLieu, TenVatLieu, NhomVatLieuId, DonViTinhId, TrangThai)
SELECT MaVatLieu, TenVatLieu,
  (SELECT Id
  FROM NhomVatLieu
  WHERE MaNhom = 'VAT_TU_KHAC'),
  (SELECT Id
  FROM DonViTinh
  WHERE MaDonVi = 'BINH'),
  N'Đang sử dụng'
FROM (VALUES
    ('VT000091', N'Ắc quy khô 12V-120Ah'),
    ('VT000093', N'Ắc quy khô 12V-200Ah')
) AS AcQuy(MaVatLieu, TenVatLieu);
GO

-- NHÓM 3: VẬT TƯ CẤP THEO PHAO (3 items)
INSERT INTO VatLieu
  (MaVatLieu, TenVatLieu, NhomVatLieuId, DonViTinhId, TrangThai)
SELECT MaVatLieu, TenVatLieu,
  (SELECT Id
  FROM NhomVatLieu
  WHERE MaNhom = 'VAT_TU_PHAO'),
  (SELECT Id
  FROM DonViTinh
  WHERE MaDonVi = DonVi),
  N'Đang sử dụng'
FROM (VALUES
    ('VT000141', N'P. VT theo phao Con quay phi 50 (Mắt xoay)', 'CAI'),
    ('VT000142', N'P. VT theo phao Vòng nối phi 55 (Chi tiết liên kết)', 'CAI'),
    ('VT000151', N'P. VT theo phao Xích có ngáng cấp 2 F32', 'KG')
) AS VatTuPhao(MaVatLieu, TenVatLieu, DonVi);
GO

-- NHÓM 4: VẬT TƯ THÀNH PHẨM (3 items)
INSERT INTO VatLieu
  (MaVatLieu, TenVatLieu, NhomVatLieuId, DonViTinhId, TrangThai)
SELECT MaVatLieu, TenVatLieu,
  (SELECT Id
  FROM NhomVatLieu
  WHERE MaNhom = 'VAT_TU_TP'),
  (SELECT Id
  FROM DonViTinh
  WHERE MaDonVi = DonVi),
  N'Đang sử dụng'
FROM (VALUES
    ('VT000092', N'Rùa 6 Tấn - TP', 'QUA'),
    ('VT000094', N'Tiết chế 12v - 40A - TP', 'CAI'),
    ('VT000097', N'Máy chớp đồng bộ điện tử đa năng 12V- 30W - TP', 'CAI')
) AS VatTuTP(MaVatLieu, TenVatLieu, DonVi);
GO

-- =============================================
-- 5. TỒN KHO (STOCK)
-- Tạo tồn kho cho TẤT CẢ vật liệu tại TẤT CẢ 30 kho
-- =============================================

-- Tạo tồn kho cho TẤT CẢ KHO (Kho mẹ + Kho con)
INSERT INTO TonKho
  (VatLieuId, KhoId, SoLuongTon, ViTri)
SELECT
  vl.Id,
  k.Id,
  CASE 
    -- Kho mẹ có số lượng lớn hơn
    WHEN k.KhoMeId IS NULL THEN
      CASE 
        WHEN nvl.MaNhom = 'NHIEN_LIEU' THEN 1000 + (vl.Id * 50)
        WHEN nvl.MaNhom = 'VAT_TU_KHAC' THEN 100 + (vl.Id % 50)
        WHEN nvl.MaNhom = 'VAT_TU_PHAO' THEN 50 + (vl.Id % 20)
        ELSE 30 + (vl.Id % 10)
      END
    -- Kho con có số lượng nhỏ hơn
    ELSE
      CASE 
        WHEN nvl.MaNhom = 'NHIEN_LIEU' THEN 100 + ((vl.Id + k.Id) % 80)
        WHEN nvl.MaNhom = 'VAT_TU_KHAC' THEN 20 + ((vl.Id + k.Id) % 30)
        WHEN nvl.MaNhom = 'VAT_TU_PHAO' THEN 10 + ((vl.Id + k.Id) % 15)
        ELSE 5 + ((vl.Id + k.Id) % 10)
      END
  END,
  CASE 
    WHEN k.KhoMeId IS NULL THEN N'Kệ A - Kho Tổng'
    ELSE N'Kệ B - ' + k.TenKho
  END
FROM VatLieu vl
  INNER JOIN NhomVatLieu nvl ON vl.NhomVatLieuId = nvl.Id
CROSS JOIN Kho k;
GO

-- =============================================
-- KIỂM TRA DỮ LIỆU
-- =============================================
PRINT N'========== KẾT QUẢ SEED DATA ==========';
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

-- Kiểm tra vật liệu theo nhóm
PRINT N'';
PRINT N'Vật liệu theo nhóm:';
SELECT nvl.TenNhom, COUNT(vl.Id) AS SoVatLieu
FROM NhomVatLieu nvl
  LEFT JOIN VatLieu vl ON nvl.Id = vl.NhomVatLieuId
GROUP BY nvl.Id, nvl.TenNhom
ORDER BY nvl.Id;

-- Hiển thị tổng hợp tồn kho theo từng kho (30 kho)
PRINT N'';
PRINT N'Tổng hợp tồn kho theo 30 kho:';
SELECT
  k.MaKho,
  k.TenKho,
  CASE WHEN k.KhoMeId IS NULL THEN N'Kho Mẹ' ELSE N'Kho Con' END AS LoaiKho,
  COUNT(DISTINCT tk.VatLieuId) AS SoLoaiVatLieu,
  SUM(tk.SoLuongTon) AS TongSoLuong
FROM TonKho tk
  INNER JOIN Kho k ON tk.KhoId = k.Id
GROUP BY k.Id, k.MaKho, k.TenKho, k.KhoMeId
ORDER BY k.Id;

-- Hiển thị chi tiết tồn kho mẫu (5 vật liệu đầu tiên x 30 kho)
PRINT N'';
PRINT N'Chi tiết tồn kho mẫu (5 vật liệu đầu x tất cả kho):';
SELECT
  k.MaKho,
  k.TenKho,
  vl.MaVatLieu,
  vl.TenVatLieu,
  nvl.TenNhom AS NhomVatLieu,
  dvt.TenDonVi,
  tk.SoLuongTon,
  tk.ViTri
FROM TonKho tk
  INNER JOIN Kho k ON tk.KhoId = k.Id
  INNER JOIN VatLieu vl ON tk.VatLieuId = vl.Id
  INNER JOIN NhomVatLieu nvl ON vl.NhomVatLieuId = nvl.Id
  INNER JOIN DonViTinh dvt ON vl.DonViTinhId = dvt.Id
WHERE vl.Id <= 5
-- 5 vật liệu đầu tiên
ORDER BY vl.Id, k.Id;

PRINT N'';
PRINT N'========== HOÀN THÀNH ==========';
GO
