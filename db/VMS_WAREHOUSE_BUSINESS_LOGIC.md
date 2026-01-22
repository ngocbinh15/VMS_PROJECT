# 📦 HỆ THỐNG QUẢN LÝ KHO VẬT LIỆU - VMS WAREHOUSE MODULE

## Business Logic & Technical Documentation

---

## 📋 MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Kiến trúc dữ liệu](#2-kiến-trúc-dữ-liệu)
3. [Nghiệp vụ phân quyền](#3-nghiệp-vụ-phân-quyền)
4. [Quản lý kho](#4-quản-lý-kho)
5. [Quản lý vật liệu](#5-quản-lý-vật-liệu)
6. [Quy trình nhập xuất kho](#6-quy-trình-nhập-xuất-kho)
7. [Audit & Truy xuất nguồn gốc](#7-audit--truy-xuất-nguồn-gốc)
8. [API & Stored Procedures](#8-api--stored-procedures)
9. [Security & Compliance](#9-security--compliance)
10. [Performance & Optimization](#10-performance--optimization)

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Mục đích

Module quản lý kho vật liệu được thiết kế để:

- **Quản lý tập trung** vật liệu phục vụ bảo dưỡng phao báo hiệu hàng hải
- **Phân quyền chặt chẽ** 3 cấp độ: Admin, Giám sát, Nhân viên
- **Truy xuất nguồn gốc hoàn toàn** (Full Audit Trail) mọi thao tác
- **Theo dõi phiên làm việc** từ đăng nhập → đăng xuất
- **Quản lý đa kho** (1 kho mẹ + 30 kho con)

### 1.2 Yêu cầu nghiệp vụ chính

| **Yêu cầu**              | **Mô tả**                                      | **Độ ưu tiên** |
| ------------------------ | ---------------------------------------------- | -------------- |
| **Phân quyền**           | RBAC 3 cấp với ràng buộc nghiêm ngặt           | ⭐⭐⭐⭐⭐     |
| **Audit Trail**          | Log đầy đủ mọi thay đổi (Who, What, When, Why) | ⭐⭐⭐⭐⭐     |
| **Session Tracking**     | Theo dõi phiên làm việc, IP, thiết bị          | ⭐⭐⭐⭐⭐     |
| **Inventory Management** | Quản lý tồn kho real-time, cảnh báo tồn kho    | ⭐⭐⭐⭐       |
| **Multi-warehouse**      | Hỗ trợ kho mẹ + kho con, chuyển kho            | ⭐⭐⭐⭐       |
| **Reporting**            | Báo cáo phân quyền, lịch sử, thống kê          | ⭐⭐⭐⭐       |

### 1.3 Người dùng hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                        ADMIN                                │
│  • Tạo/xóa/khóa tài khoản                                   │
│  • Phân quyền Nhân viên ↔ Giám sát                          │
│  • Xem tất cả dữ liệu                                       │
│  • Quản lý hệ thống                                         │
└─────────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     GIÁM SÁT                                │
│  • Xem tất cả phiếu nhập/xuất/chuyển kho                    │
│  • Xem tồn kho toàn hệ thống                                │
│  • Xem lịch sử thao tác của tất cả nhân viên                │
│  • Duyệt phiếu (nếu cấu hình workflow)                      │
└─────────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    NHÂN VIÊN KHO                            │
│  • Tạo phiếu nhập/xuất/chuyển kho                           │
│  • CHỈ xem phiếu của MÌNH tạo                               │
│  • CHỈ xem lịch sử vật liệu do MÌNH thay đổi                │
│  • Không có quyền xem dữ liệu của người khác                │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. KIẾN TRÚC DỮ LIỆU

### 2.1 ERD - Entity Relationship Diagram

```
┌─────────────┐      1:N      ┌──────────────┐     1:N     ┌──────────────────┐
│   VaiTro    │◄──────────────│  TaiKhoan    │◄───────────│ PhienLamViec      │
│             │               │              │            │                   │
│ • MaVaiTro  │               │ • VaiTroId   │            │ • TaiKhoanId      │
│ • TenVaiTro │               │ • NguoiTao   │            │ • ThoiGianDN      │
└─────────────┘               └──────────────┘            │ • ThoiGianDX      │
                                     │                     │ • DiaChi_IP      │
                                     │ 1:N                 └──────────────────┘
                                     │                              │
                                     ▼                              │ 1:N
                              ┌─────────────┐                       │
                              │     Kho     │                       ▼
                              │             │          ┌────────────────────────┐
                              │ • KhoMeId   │◄────────│  PhieuNhapXuat          │
                              │ • LoaiKho   │   1:N   │                         │
                              └─────────────┘         │ • PhienLamViecId        │
                                     │                │ • KhoNguonId            │
                                     │ 1:N            │ • KhoNhapId             │
                                     ▼                │ • LoaiPhieu             │
                              ┌─────────────┐         └─────────────────────────┘
                              │   TonKho    │                      │
                              │             │                      │ 1:N
                              │ • VatLieuId │                      ▼
                              │ • KhoId     │         ┌───────────────────────┐
                              │ • SoLuongTon│         │ ChiTietPhieuNhapXuat  │
                              │ • SoLuongKD │         │                       │
                              └─────────────┘         │ • VatLieuId           │
                                     ▲                │ • SoLuong             │
                                     │                │ • DonGia              │
                              ┌─────────────┐         └───────────────────────┘
                              │  VatLieu    │
                              │             │
                              │ • MaVatLieu │         ┌────────────────────────┐
                              │ • NhomVLId  │         │   LichSuVatLieu        │
                              │ • MucMin    │         │                        │
                              │ • MucMax    │         │ • VatLieuId            │
                              └─────────────┘         │ • KhoId                │
                                                      │ • LoaiThayDoi          │
                                                      │ • SoLuongTruoc         │
                                                      │ • SoLuongThayDoi       │
                                                      │ • SoLuongSau           │
                                                      │ • PhienLamViecId       │
                                                      └────────────────────────┘
```

### 2.2 Các bảng chính

#### **2.2.1 Bảng Quản lý người dùng**

| Bảng           | Mục đích                                          | Ghi chú                          |
| -------------- | ------------------------------------------------- | -------------------------------- |
| `VaiTro`       | Định nghĩa 2 vai trò: ADMIN, NHAN_VIEN  | Master data                      |
| `TaiKhoan`     | Thông tin người dùng, mật khẩu (hash), trạng thái | Self-referencing FK cho NguoiTao |
| `PhienLamViec` | Session tracking từ đăng nhập → đăng xuất         | Lưu IP, thiết bị                 |

#### **2.2.2 Bảng Quản lý kho**

| Bảng          | Mục đích                                     | Ghi chú                         |
| ------------- | -------------------------------------------- | ------------------------------- |
| `Kho`         | Định nghĩa kho mẹ + 30 kho con               | Self-referencing FK cho KhoMeId |
| `NhomVatLieu` | Phân nhóm vật liệu (Xích, Rùa neo, Đèn...)   | Master data                     |
| `DonViTinh`   | Đơn vị tính (Cái, Kg, Tấn, Lít...)           | Master data                     |
| `VatLieu`     | Thông tin vật liệu, mức tồn tối thiểu/tối đa | Core entity                     |

#### **2.2.3 Bảng Quản lý tồn kho**

| Bảng     | Mục đích                              | Ghi chú                             |
| -------- | ------------------------------------- | ----------------------------------- |
| `TonKho` | Tồn kho real-time từng vật liệu x kho | Có computed column `SoLuongKhaDung` |

**Computed Column quan trọng:**

```sql
SoLuongKhaDung AS (SoLuongTon - SoLuongDatCho) PERSISTED
```

#### **2.2.4 Bảng Quản lý phiếu**

| Bảng                   | Mục đích                                     | Ghi chú                        |
| ---------------------- | -------------------------------------------- | ------------------------------ |
| `PhieuNhapXuat`        | Header phiếu: NHAP_KHO, XUAT_KHO, CHUYEN_KHO | Có workflow duyệt              |
| `ChiTietPhieuNhapXuat` | Chi tiết vật liệu từng phiếu                 | Có computed column `ThanhTien` |

**Computed Column:**

```sql
ThanhTien AS (SoLuong * DonGia) PERSISTED
```

#### **2.2.5 Bảng Audit Log**

| Bảng            | Mục đích                                     | Ghi chú       |
| --------------- | -------------------------------------------- | ------------- |
| `LichSuVatLieu` | Lưu mọi thay đổi vật liệu (Full Audit Trail) | Immutable log |

---

## 3. NGHIỆP VỤ PHÂN QUYỀN

### 3.1 Vai trò và quyền hạn

#### **ADMIN (Quản trị viên)**

```sql
✓ Tạo tài khoản mới (sp_TaoTaiKhoan)
✓ Phân quyền/Thay đổi vai trò (sp_ThayDoiVaiTro)
✓ Khóa/Mở khóa/Xóa tài khoản (sp_KhoaTaiKhoan)
✓ Xem tất cả phiếu nhập/xuất/chuyển kho
✓ Xem lịch sử thao tác của tất cả nhân viên
✓ Xem tồn kho toàn hệ thống
✓ Báo cáo tổng hợp (vw_BaoCao_TatCaPhieu_GiamSat)

✗ KHÔNG thể tự khóa tài khoản mình
✗ KHÔNG thể tự thay đổi vai trò mình
```

#### **NHAN_VIEN (Nhân viên kho)**

```sql
✓ Tạo phiếu nhập kho (sp_NhapKho)
✓ Tạo phiếu xuất kho (sp_XuatKho)
✓ Tạo phiếu chuyển kho (sp_ChuyenKho)
✓ Xem phiếu CỦA MÌNH tạo (vw_BaoCao_PhieuTheoNhanVien)
✓ Xem lịch sử vật liệu DO MÌNH thay đổi

✗ KHÔNG xem được phiếu của người khác
✗ KHÔNG xem được lịch sử do người khác tạo
✗ KHÔNG thể xem tổng hợp toàn hệ thống
```

### 3.2 Ràng buộc bảo mật

```sql
-- Admin không thể tự thay đổi vai trò mình
IF @TaiKhoanAdmin = @TaiKhoanId
BEGIN
    RETURN ERROR: 'Không thể tự thay đổi vai trò của chính mình'
END

-- Admin không thể tự khóa tài khoản mình
IF @TaiKhoanAdmin = @TaiKhoanId
BEGIN
    RETURN ERROR: 'Không thể tự khóa tài khoản của chính mình'
END
```

### 3.3 Row-Level Security (RLS)

Hệ thống sử dụng **Application-Level RLS** thông qua Views và Stored Procedures:

```sql
-- Nhân viên chỉ xem phiếu của mình
CREATE VIEW vw_BaoCao_PhieuTheoNhanVien AS
SELECT ...
FROM PhieuNhapXuat pnx
WHERE pnx.TaiKhoanId = @CurrentUserId -- Filtered by session

-- Giám sát xem tất cả
CREATE VIEW vw_BaoCao_TatCaPhieu_GiamSat AS
SELECT ...
FROM PhieuNhapXuat pnx
-- No filter, all data visible
```

---

## 4. QUẢN LÝ KHO

### 4.1 Cấu trúc kho

```
┌─────────────────────────────────────────────────────┐
│              KHO_ME (Kho Mẹ - Trung Tâm)            │
│  • MaKho: KHO_ME                                    │
│  • Chức năng: Kho trung tâm, quản lý tất cả vật liệu│
│  • Diện tích: 500 m²                                │
│  • Sức chứa: 100 tấn                                │
└─────────────────────────────────────────────────────┘
            │
            ├──► KHO_01 (Kho Con 01) - 20m², 5 tấn
            ├──► KHO_02 (Kho Con 02) - 20m², 5 tấn
            ├──► KHO_03 (Kho Con 03) - 20m², 5 tấn
            │    ...
            └──► KHO_30 (Kho Con 30) - 20m², 5 tấn
```

### 4.2 Quy tắc quản lý kho

| Quy tắc        | Mô tả                                          |
| -------------- | ---------------------------------------------- |
| **Kho mẹ**     | `KhoMeId IS NULL`, chứa tất cả vật liệu dự trữ |
| **Kho con**    | `KhoMeId = ID_KHO_ME`, kho nhỏ phân tán        |
| **Chuyển kho** | Cho phép: Mẹ→Con, Con→Mẹ, Con→Con              |
| **Tồn kho**    | Mỗi vật liệu x kho = 1 record trong `TonKho`   |

### 4.3 Tồn kho và cảnh báo

#### **Tính toán tồn kho khả dụng**

```sql
-- Công thức
SoLuongKhaDung = SoLuongTon - SoLuongDatCho

-- Ví dụ
SoLuongTon = 100
SoLuongDatCho = 20  -- Đặt chỗ cho lệnh xuất chưa thực hiện
SoLuongKhaDung = 80 -- Khả dụng thực tế
```

#### **Cảnh báo tồn kho**

```sql
CASE
    WHEN SoLuongTon <= MucToiThieu THEN 'Cảnh báo: Tồn thấp'
    WHEN SoLuongTon >= MucToiDa     THEN 'Cảnh báo: Tồn cao'
    ELSE 'Bình thường'
END
```

**Ví dụ:**

- Vật liệu: Xích phao 10mm
- Mức tối thiểu: 50 kg
- Mức tối đa: 500 kg
- Tồn hiện tại: 30 kg → **CẢNH BÁO: Tồn thấp** → Cần đặt hàng

---

## 5. QUẢN LÝ VẬT LIỆU

### 5.1 Phân loại vật liệu

| Nhóm          | Mã nhóm  | Ví dụ vật liệu             |
| ------------- | -------- | -------------------------- |
| Xích phao     | XICH     | Xích 8mm, 10mm, 12mm       |
| Rùa neo       | RUA      | Rùa neo 50kg, 100kg, 200kg |
| Đèn báo hiệu  | DEN      | Đèn LED, đèn quay, pin     |
| Sơn           | SON      | Sơn chống rỉ, sơn phao     |
| Thiết bị điện | DIEN     | Pin, ắc quy, dây điện      |
| Cơ khí        | CO_KHI   | Ốc vít, bu lông, gasket    |
| Hóa chất      | HOA_CHAT | Chống rỉ, tẩy rửa          |

### 5.2 Thuộc tính vật liệu

```sql
VatLieu {
    MaVatLieu      -- VD: XICH-10MM-001
    TenVatLieu     -- Xích phao 10mm
    NhomVatLieuId  -- FK → NhomVatLieu
    DonViTinhId    -- FK → DonViTinh (KG)
    MucToiThieu    -- 50
    MucToiDa       -- 500
    QuyDinhBaoQuan -- "Bảo quản nơi khô ráo..."
}
```

### 5.3 Vị trí trong kho

```sql
TonKho {
    ViTri -- "Kệ A1-Tầng 2", "Khu B-Góc phải"
}
```

**Best Practice:**

- Sử dụng mã hóa vị trí: `A1`, `B2-T3` (Kệ B2 - Tầng 3)
- Thuận tiện cho kiểm kê và tìm kiếm

---

## 6. QUY TRÌNH NHẬP XUẤT KHO

### 6.1 Quy trình Nhập kho

```
┌─────────────────────────────────────────────────────────┐
│ 1. ĐĂNG NHẬP                                            │
│    sp_DangNhap(@TenDangNhap, @MatKhau)                 │
│    → Trả về: PhienLamViecId, TaiKhoanId, VaiTro        │
└─────────────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 2. TẠO PHIẾU NHẬP KHO                                   │
│    sp_NhapKho(                                          │
│        @PhienLamViecId,                                 │
│        @TaiKhoanId,                                     │
│        @KhoNhapId,           -- Kho đích                │
│        @NgayPhieu,                                      │
│        @DanhSachVatLieu      -- JSON array              │
│    )                                                    │
└─────────────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 3. HỆ THỐNG TỰ ĐỘNG THỰC HIỆN                          │
│    a. Tạo mã phiếu: PN2026000001                       │
│    b. Thêm chi tiết vật liệu vào ChiTietPhieuNhapXuat  │
│    c. Cập nhật TonKho (Upsert)                         │
│    d. Ghi log vào LichSuVatLieu:                       │
│       - LoaiThayDoi: 'NHAP'                            │
│       - SoLuongTruoc, SoLuongThayDoi, SoLuongSau       │
│       - PhienLamViecId, TaiKhoanId                     │
└─────────────────────────────────────────────────────────┘
```

#### **Ví dụ JSON input:**

```json
[
  {
    "VatLieuId": 1,
    "SoLuong": 100.5,
    "DonGia": 50000,
    "ViTri": "A1-T2"
  },
  {
    "VatLieuId": 2,
    "SoLuong": 50,
    "DonGia": 120000,
    "ViTri": "B3-T1"
  }
]
```

### 6.2 Quy trình Xuất kho

```
┌─────────────────────────────────────────────────────────┐
│ 1. TẠO PHIẾU XUẤT KHO                                   │
│    sp_XuatKho(                                          │
│        @PhienLamViecId,                                 │
│        @TaiKhoanId,                                     │
│        @KhoXuatId,           -- Kho nguồn               │
│        @NgayPhieu,                                      │
│        @PhaoId,              -- Nếu xuất cho phao       │
│        @DanhSachVatLieu                                 │
│    )                                                    │
└─────────────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 2. KIỂM TRA TỒN KHO                                     │
│    IF SoLuongKhaDung < SoLuongYeuCau THEN               │
│        ROLLBACK + ERROR "Tồn kho không đủ"             │
│    END                                                  │
└─────────────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 3. HỆ THỐNG TỰ ĐỘNG THỰC HIỆN                          │
│    a. Tạo mã phiếu: PX2026000001                       │
│    b. Thêm chi tiết vật liệu                           │
│    c. TRỪ TonKho.SoLuongTon                            │
│    d. Ghi log vào LichSuVatLieu:                       │
│       - LoaiThayDoi: 'XUAT'                            │
│       - SoLuongThayDoi: Số âm (-50)                    │
└─────────────────────────────────────────────────────────┘
```

### 6.3 Quy trình Chuyển kho

```
┌─────────────────────────────────────────────────────────┐
│ sp_ChuyenKho(                                           │
│     @KhoNguonId,      -- Kho xuất                       │
│     @KhoNhapId,       -- Kho nhập                       │
│     @DanhSachVatLieu                                    │
│ )                                                       │
└─────────────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────┐
│ VALIDATE                                                │
│  • KhoNguonId ≠ KhoNhapId                              │
│  • SoLuongKhaDung(KhoNguon) >= SoLuongChuyển           │
└─────────────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────┐
│ TRANSACTION (Atomic)                                    │
│  1. TRỪ tồn kho nguồn                                  │
│     UPDATE TonKho SET SoLuongTon = SoLuongTon - X      │
│     WHERE KhoId = @KhoNguonId                          │
│                                                         │
│  2. CỘNG tồn kho đích                                  │
│     UPDATE/INSERT TonKho SET SoLuongTon = SoLuongTon+X │
│     WHERE KhoId = @KhoNhapId                           │
│                                                         │
│  3. GHI 2 LOG                                          │
│     - CHUYEN_DI (kho nguồn)                            │
│     - CHUYEN_DEN (kho đích)                            │
└─────────────────────────────────────────────────────────┘
```

**Use case:**

- Kho Mẹ → Kho Con 01: Phân bổ vật liệu cho trạm địa phương
- Kho Con 15 → Kho Mẹ: Thu hồi vật liệu dư thừa
- Kho Con 05 → Kho Con 10: Điều chuyển giữa các kho

---

## 7. AUDIT & TRUY XUẤT NGUỒN GỐC

### 7.1 Session Tracking (Phiên làm việc)

#### **Chu kỳ phiên:**

```
ĐĂNG NHẬP
    ↓
sp_DangNhap() → Tạo PhienLamViec
    ├── ThoiGianDangNhap: 2026-01-15 08:00:00
    ├── DiaChi_IP: 192.168.1.100
    ├── ThietBi: Mozilla/5.0 (Windows NT 10.0)
    └── TrangThai: 'Đang hoạt động'
    ↓
THAO TÁC 1..N
    ├── Tạo phiếu nhập (PhieuNhapXuat.PhienLamViecId)
    ├── Tạo phiếu xuất
    └── Mỗi thay đổi vật liệu → LichSuVatLieu.PhienLamViecId
    ↓
ĐĂNG XUẤT
    ↓
sp_DangXuat() → Cập nhật PhienLamViec
    ├── ThoiGianDangXuat: 2026-01-15 17:00:00
    └── TrangThai: 'Đã đăng xuất'
```

#### **Truy vấn phiên:**

```sql
-- Xem chi tiết 1 phiên làm việc
EXEC sp_BaoCao_HoatDongTheoPhien @PhienLamViecId = 123

-- Kết quả:
-- Phần 1: Thông tin phiên
    ThoiGianDangNhap: 2026-01-15 08:00
    ThoiGianDangXuat: 2026-01-15 17:00
    ThoiGianLamViec: 540 phút (9 giờ)
    DiaChi_IP: 192.168.1.100

-- Phần 2: Danh sách phiếu tạo trong phiên
    PN2026000123 - Nhập kho - 10 vật liệu
    PX2026000456 - Xuất kho - 5 vật liệu
    PCK2026000789 - Chuyển kho - 3 vật liệu

-- Phần 3: Lịch sử thay đổi vật liệu
    [08:15] NHAP - Xích 10mm - Kho_01: +100kg
    [10:30] XUAT - Đèn LED - Kho_05: -20 cái
    [14:20] CHUYEN_DI - Sơn chống rỉ - Kho_ME → Kho_03
```

### 7.2 Audit Log (Lịch sử vật liệu)

#### **Cấu trúc log:**

```sql
LichSuVatLieu {
    -- WHO (Ai)
    TaiKhoanId       -- Người thực hiện
    PhienLamViecId   -- Phiên làm việc

    -- WHAT (Gì)
    VatLieuId        -- Vật liệu nào
    LoaiThayDoi      -- NHAP, XUAT, CHUYEN_DI, CHUYEN_DEN
    SoLuongTruoc     -- 100
    SoLuongThayDoi   -- +50 hoặc -30
    SoLuongSau       -- 150

    -- WHERE (Đâu)
    KhoId            -- Kho chính
    KhoLienQuanId    -- Kho liên quan (nếu chuyển kho)

    -- WHEN (Khi nào)
    ThoiGian         -- 2026-01-15 10:30:45

    -- WHY (Tại sao)
    LyDo             -- "Nhập vật liệu từ nhà cung cấp ABC"
    PhieuNhapXuatId  -- FK → Phiếu gốc
}
```

#### **Các loại thay đổi:**

| LoaiThayDoi  | Mô tả                        | SoLuongThayDoi |
| ------------ | ---------------------------- | -------------- |
| `NHAP`       | Nhập kho                     | Dương (+)      |
| `XUAT`       | Xuất kho                     | Âm (-)         |
| `CHUYEN_DI`  | Chuyển đi kho khác           | Âm (-)         |
| `CHUYEN_DEN` | Nhận từ kho khác             | Dương (+)      |
| `DIEU_CHINH` | Điều chỉnh tồn kho (kiểm kê) | Dương hoặc Âm  |
| `KIEM_KE`    | Kiểm kê định kỳ              | 0 hoặc ±       |

#### **Ví dụ Audit Trail:**

```
Xích phao 10mm - Kho_01

2026-01-10 09:00:00 | NHAP      | 0 → +100 → 100kg  | PN2026000050 | NV_A
2026-01-12 14:30:00 | XUAT      | 100 → -20 → 80kg  | PX2026000075 | NV_B
2026-01-13 10:15:00 | CHUYEN_DI | 80 → -30 → 50kg   | PCK2026000012 | NV_A
2026-01-15 08:20:00 | DIEU_CHINH| 50 → +5 → 55kg    | (Kiểm kê)     | NV_C
```

### 7.3 Phân quyền xem Audit Log

```sql
-- Nhân viên: Chỉ xem lịch sử DO MÌNH tạo
EXEC sp_BaoCao_LichSuVatLieu
    @TaiKhoanId = 5,
    @VaiTroMa = 'NHAN_VIEN'
→ WHERE LichSuVatLieu.TaiKhoanId = 5

-- Giám sát/Admin: Xem TẤT CẢ lịch sử
EXEC sp_BaoCao_LichSuVatLieu
    @TaiKhoanId = 1,
    @VaiTroMa = 'GIAM_SAT'
→ WHERE 1=1 (No filter)
```

---

## 8. API & STORED PROCEDURES

### 8.1 Nhóm Authentication & Session

| SP            | Mục đích                  | Input                             | Output                 |
| ------------- | ------------------------- | --------------------------------- | ---------------------- |
| `sp_DangNhap` | Đăng nhập, tạo phiên      | TenDangNhap, MatKhau, IP, ThietBi | PhienLamViecId, VaiTro |
| `sp_DangXuat` | Đăng xuất, kết thúc phiên | PhienLamViecId                    | Success message        |

**Ví dụ:**

```sql
-- Đăng nhập
EXEC sp_DangNhap
    @TenDangNhap = 'nv_kho_01',
    @MatKhau = 'hashed_password',
    @DiaChi_IP = '192.168.1.100',
    @ThietBi = 'Mozilla/5.0...'

-- Output:
Success = 1
PhienLamViecId = 1234
VaiTro = 'NHAN_VIEN'
```

### 8.2 Nhóm Warehouse Operations

| SP             | Mục đích                 | Phân quyền | Transaction |
| -------------- | ------------------------ | ---------- | ----------- |
| `sp_NhapKho`   | Nhập vật liệu vào kho    | Nhân viên+ | ✓ ACID      |
| `sp_XuatKho`   | Xuất vật liệu từ kho     | Nhân viên+ | ✓ ACID      |
| `sp_ChuyenKho` | Chuyển vật liệu giữa kho | Nhân viên+ | ✓ ACID      |

**Đặc điểm chung:**

- **Atomic Transaction**: Rollback toàn bộ nếu có lỗi
- **Validation**: Kiểm tra tồn kho trước khi thực hiện
- **Auto-log**: Tự động ghi vào `LichSuVatLieu`
- **JSON Input**: Nhận danh sách vật liệu dạng JSON array

### 8.3 Nhóm Reporting

| SP                            | Mục đích               | Phân quyền        |
| ----------------------------- | ---------------------- | ----------------- |
| `sp_XemPhieu_TheoQuyen`       | Xem phiếu theo vai trò | Tất cả (filtered) |
| `sp_BaoCao_LichSuVatLieu`     | Lịch sử vật liệu       | Tất cả (filtered) |
| `sp_BaoCao_HoatDongTheoPhien` | Chi tiết 1 phiên       | Tất cả            |
| `sp_LayLichSuPhienLamViec`    | Lịch sử tất cả phiên   | Giám sát/Admin    |

### 8.4 Nhóm Admin (ADMIN ONLY)

| SP                 | Mục đích          | Validation           |
| ------------------ | ----------------- | -------------------- |
| `sp_TaoTaiKhoan`   | Tạo user mới      | Kiểm tra quyền Admin |
| `sp_ThayDoiVaiTro` | Phân quyền        | Không tự sửa mình    |
| `sp_KhoaTaiKhoan`  | Khóa/Mở khóa user | Không tự khóa mình   |

### 8.5 Views (Read-only)

| View                           | Mục đích                | Phân quyền           |
| ------------------------------ | ----------------------- | -------------------- |
| `vw_TonKho_TheoKhoCon`         | Tồn kho từng kho con    | Tất cả               |
| `vw_TonKho_TongHop`            | Tổng hợp tồn kho        | Giám sát/Admin       |
| `vw_BaoCao_PhieuTheoNhanVien`  | Phiếu của nhân viên     | Nhân viên (filtered) |
| `vw_BaoCao_TatCaPhieu_GiamSat` | Tất cả phiếu + thống kê | Giám sát/Admin       |

---

## 9. SECURITY & COMPLIANCE

### 9.1 Password Security

```sql
-- ❌ KHÔNG LÀM
MatKhau = 'plain_text_password'

-- ✓ ĐÚNG
MatKhau = HASHBYTES('SHA2_256', @PlainPassword + @Salt)

-- Hoặc tốt hơn: Sử dụng bcrypt/Argon2 ở application layer
```

**Khuyến nghị:**

- Sử dụng bcrypt hoặc Argon2 ở ứng dụng
- Store hash + salt trong database
- Never log passwords

### 9.2 SQL Injection Prevention

**Stored Procedures tự động bảo vệ:**

```sql
-- ✓ An toàn: Parameterized query
EXEC sp_DangNhap
    @TenDangNhap = @Input1,  -- Tự động escape
    @MatKhau = @Input2

-- ❌ Nguy hiểm: Dynamic SQL (KHÔNG dùng)
EXEC('SELECT * FROM TaiKhoan WHERE TenDangNhap = ''' + @Input + '''')
```

### 9.3 Phân quyền Database Level

```sql
-- Tạo database roles
CREATE ROLE db_vms_admin;
CREATE ROLE db_vms_giamsat;
CREATE ROLE db_vms_nhanvien;

-- Cấp quyền Admin
GRANT EXECUTE ON sp_TaoTaiKhoan TO db_vms_admin;
GRANT EXECUTE ON sp_ThayDoiVaiTro TO db_vms_admin;
GRANT EXECUTE ON sp_KhoaTaiKhoan TO db_vms_admin;

-- Cấp quyền Giám sát
GRANT SELECT ON vw_BaoCao_TatCaPhieu_GiamSat TO db_vms_giamsat;
GRANT EXECUTE ON sp_BaoCao_LichSuVatLieu TO db_vms_giamsat;

-- Cấp quyền Nhân viên
GRANT EXECUTE ON sp_NhapKho TO db_vms_nhanvien;
GRANT EXECUTE ON sp_XuatKho TO db_vms_nhanvien;
GRANT SELECT ON vw_BaoCao_PhieuTheoNhanVien TO db_vms_nhanvien;
```

### 9.4 Audit Compliance

Hệ thống đáp ứng các yêu cầu audit:

✓ **Who**: Lưu `TaiKhoanId` mọi thao tác  
✓ **What**: Lưu `LoaiThayDoi`, `SoLuongTruoc`, `SoLuongSau`  
✓ **When**: Lưu `ThoiGian` chính xác đến giây  
✓ **Where**: Lưu `KhoId`, `KhoLienQuanId`, `DiaChi_IP`  
✓ **Why**: Lưu `LyDo`, `GhiChu`, `PhieuNhapXuatId`

**Immutable Log**: Bảng `LichSuVatLieu` KHÔNG cho phép UPDATE/DELETE.

---

## 10. PERFORMANCE & OPTIMIZATION

### 10.1 Indexes (28 indexes)

#### **Clustered Indexes (Primary Keys)**

```sql
-- Tất cả bảng có IDENTITY PRIMARY KEY
-- Auto-indexed, optimal for range queries
```

#### **Non-Clustered Indexes**

| Index                        | Bảng          | Cột       | Mục đích            |
| ---------------------------- | ------------- | --------- | ------------------- |
| `IX_TaiKhoan_VaiTro`         | TaiKhoan      | VaiTroId  | Filter by role      |
| `IX_TaiKhoan_TrangThai`      | TaiKhoan      | TrangThai | Active users        |
| `IX_TonKho_VatLieu`          | TonKho        | VatLieuId | Lookup by material  |
| `IX_TonKho_Kho`              | TonKho        | KhoId     | Lookup by warehouse |
| `IX_PhieuNhapXuat_LoaiPhieu` | PhieuNhapXuat | LoaiPhieu | Filter by type      |
| `IX_PhieuNhapXuat_NgayPhieu` | PhieuNhapXuat | NgayPhieu | Date range queries  |
| `IX_LichSuVatLieu_ThoiGian`  | LichSuVatLieu | ThoiGian  | Audit log search    |

### 10.2 Query Optimization Tips

#### **✓ Sử dụng Views có sẵn**

```sql
-- ✓ Tốt: View đã optimize
SELECT * FROM vw_TonKho_TongHop
WHERE MaVatLieu = 'XICH-10MM-001'

-- ❌ Tránh: Manual JOIN phức tạp
SELECT ...
FROM TonKho tk
INNER JOIN VatLieu vl ...
INNER JOIN Kho k ...
```

#### **✓ Sử dụng Stored Procedures**

```sql
-- ✓ Tốt: SP có execution plan cache
EXEC sp_BaoCao_LichSuVatLieu @VatLieuId = 5

-- ❌ Tránh: Dynamic query từ application
SELECT * FROM LichSuVatLieu WHERE ...
```

#### **✓ Pagination**

```sql
-- Với dataset lớn
SELECT *
FROM vw_BaoCao_TatCaPhieu_GiamSat
ORDER BY NgayPhieu DESC
OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY
```

### 10.3 Transaction Best Practices

```sql
-- ✓ Tốt: Transaction ngắn gọn
BEGIN TRANSACTION
    UPDATE TonKho ...
    INSERT INTO LichSuVatLieu ...
COMMIT

-- ❌ Tránh: Transaction dài, lock nhiều
BEGIN TRANSACTION
    ... complex logic ...
    WAITFOR DELAY '00:01:00'  -- ❌ Giữ lock lâu
COMMIT
```

### 10.4 Computed Columns

```sql
-- Persisted computed columns → Indexed
SoLuongKhaDung AS (SoLuongTon - SoLuongDatCho) PERSISTED
ThanhTien AS (SoLuong * DonGia) PERSISTED

-- Lợi ích:
-- 1. Tính toán 1 lần khi INSERT/UPDATE
-- 2. Không tính lại mỗi SELECT
-- 3. Có thể index được
```

### 10.5 Monitoring

```sql
-- Xem execution plan
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

EXEC sp_XemPhieu_TheoQuyen @TaiKhoanId = 5, @VaiTroMa = 'NHAN_VIEN'

-- Xem index usage
SELECT
    OBJECT_NAME(s.object_id) AS TableName,
    i.name AS IndexName,
    s.user_seeks,
    s.user_scans,
    s.user_lookups
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id
WHERE database_id = DB_ID('VMS_DB')
ORDER BY s.user_seeks + s.user_scans + s.user_lookups DESC;
```

---

## 11. USE CASES & EXAMPLES

### Use Case 1: Nhân viên nhập vật liệu mới về kho

```sql
-- Bước 1: Đăng nhập
DECLARE @PhienLamViecId INT, @TaiKhoanId INT;

EXEC sp_DangNhap
    @TenDangNhap = 'nv_kho_01',
    @MatKhau = 'hashed_password',
    @DiaChi_IP = '192.168.1.50',
    @ThietBi = 'Chrome 120/Windows 10'
-- Output: @PhienLamViecId = 100, @TaiKhoanId = 5

-- Bước 2: Nhập kho
DECLARE @DanhSachVatLieu NVARCHAR(MAX) = N'
[
  {"VatLieuId": 1, "SoLuong": 500, "DonGia": 50000, "ViTri": "A1-T2"},
  {"VatLieuId": 3, "SoLuong": 100, "DonGia": 120000, "ViTri": "B2-T1"}
]'

EXEC sp_NhapKho
    @PhienLamViecId = 100,
    @TaiKhoanId = 5,
    @KhoNhapId = 15,  -- KHO_15
    @NgayPhieu = '2026-01-15',
    @LyDo = N'Nhập vật liệu từ nhà cung cấp ABC',
    @DonViCungCap = N'Công ty TNHH ABC',
    @SoHoaDon = 'HD2026001',
    @DanhSachVatLieu = @DanhSachVatLieu

-- Output:
-- Success = 1
-- MaPhieu = PN2026000123
-- Message = 'Nhập kho thành công'

-- Bước 3: Đăng xuất
EXEC sp_DangXuat @PhienLamViecId = 100
```

### Use Case 2: Chuyển vật liệu từ Kho Mẹ sang Kho Con

```sql
DECLARE @DanhSachChuyen NVARCHAR(MAX) = N'
[
  {"VatLieuId": 1, "SoLuong": 100, "ViTriNguon": "A1", "ViTriNhap": "X5"},
  {"VatLieuId": 2, "SoLuong": 50, "ViTriNguon": "B3", "ViTriNhap": "Y2"}
]'

EXEC sp_ChuyenKho
    @PhienLamViecId = 100,
    @TaiKhoanId = 5,
    @KhoNguonId = 1,      -- KHO_ME
    @KhoNhapId = 10,      -- KHO_10
    @NgayPhieu = '2026-01-15',
    @LyDo = N'Điều chuyển vật liệu cho trạm Quy Nhơn',
    @DanhSachVatLieu = @DanhSachChuyen

-- Kết quả:
-- 1. Kho Mẹ: SoLuongTon giảm
-- 2. Kho Con 10: SoLuongTon tăng
-- 3. Log ghi 2 bên: CHUYEN_DI + CHUYEN_DEN
```

### Use Case 3: Giám sát xem báo cáo tổng hợp

```sql
-- Xem tất cả phiếu trong tháng 1/2026
EXEC sp_XemPhieu_TheoQuyen
    @TaiKhoanId = 1,
    @VaiTroMa = 'GIAM_SAT',
    @TuNgay = '2026-01-01',
    @DenNgay = '2026-01-31'

-- Xem lịch sử 1 vật liệu cụ thể
EXEC sp_BaoCao_LichSuVatLieu
    @TaiKhoanId = 1,
    @VaiTroMa = 'GIAM_SAT',
    @VatLieuId = 5,
    @TuNgay = '2026-01-01',
    @DenNgay = '2026-01-31'
```

### Use Case 4: Admin quản lý tài khoản

```sql
-- Tạo nhân viên mới
EXEC sp_TaoTaiKhoan
    @TaiKhoanAdmin = 1,
    @TenDangNhap = 'nv_kho_05',
    @MatKhau = 'hashed_password',
    @HoTen = N'Nguyễn Văn E',
    @Email = 'nv05@vms.vn',
    @VaiTroId = 3  -- NHAN_VIEN

-- Thăng cấp lên Giám sát
EXEC sp_ThayDoiVaiTro
    @TaiKhoanAdmin = 1,
    @TaiKhoanId = 10,
    @VaiTroMoi = 2  -- GIAM_SAT

-- Khóa tài khoản
EXEC sp_KhoaTaiKhoan
    @TaiKhoanAdmin = 1,
    @TaiKhoanId = 15,
    @TrangThai = N'Tạm khóa'
```

---

## 12. MIGRATION & DEPLOYMENT

### 12.1 Deployment Checklist

```
☐ 1. Backup database hiện tại
☐ 2. Chạy VMS_WAREHOUSE_MODULE.sql trên môi trường test
☐ 3. Verify tất cả tables, views, SPs đã được tạo
☐ 4. Insert master data (VaiTro, DonViTinh, NhomVatLieu)
☐ 5. Tạo Kho Mẹ + 30 Kho Con
☐ 6. Tạo tài khoản Admin đầu tiên
☐ 7. Test các SP chính (sp_NhapKho, sp_XuatKho, sp_ChuyenKho)
☐ 8. Verify indexes đã được tạo (28 indexes)
☐ 9. Cấu hình database roles & permissions
☐ 10. Deploy lên production
```

### 12.2 Post-Deployment Validation

```sql
-- Kiểm tra số lượng bảng
SELECT COUNT(*) FROM sys.tables
WHERE schema_id = SCHEMA_ID('dbo')
-- Expected: +11 tables

-- Kiểm tra số lượng SPs
SELECT COUNT(*) FROM sys.procedures
WHERE schema_id = SCHEMA_ID('dbo')
-- Expected: +11 procedures

-- Kiểm tra số lượng Views
SELECT COUNT(*) FROM sys.views
WHERE schema_id = SCHEMA_ID('dbo')
-- Expected: +4 views

-- Kiểm tra indexes
SELECT
    t.name AS TableName,
    COUNT(i.index_id) AS IndexCount
FROM sys.tables t
LEFT JOIN sys.indexes i ON t.object_id = i.object_id
WHERE t.schema_id = SCHEMA_ID('dbo')
GROUP BY t.name
ORDER BY IndexCount DESC
```

---

## 13. TROUBLESHOOTING

### Vấn đề 1: "Tồn kho không đủ"

```sql
-- Chẩn đoán
SELECT
    vl.MaVatLieu,
    vl.TenVatLieu,
    tk.SoLuongTon,
    tk.SoLuongDatCho,
    tk.SoLuongKhaDung
FROM TonKho tk
INNER JOIN VatLieu vl ON tk.VatLieuId = vl.Id
WHERE tk.KhoId = @KhoId
  AND tk.VatLieuId = @VatLieuId

-- Giải pháp:
-- 1. Kiểm tra SoLuongDatCho có bị sai không
-- 2. Nhập thêm vật liệu
-- 3. Chuyển từ kho khác
```

### Vấn đề 2: "Không xem được phiếu"

```sql
-- Nguyên nhân: Phân quyền
-- Nhân viên chỉ xem phiếu của MÌNH

-- Kiểm tra
SELECT * FROM vw_BaoCao_PhieuTheoNhanVien
WHERE TaiKhoanId = @CurrentUserId
```

### Vấn đề 3: Performance chậm

```sql
-- Rebuild indexes
ALTER INDEX ALL ON TonKho REBUILD
ALTER INDEX ALL ON LichSuVatLieu REBUILD

-- Update statistics
UPDATE STATISTICS TonKho
UPDATE STATISTICS LichSuVatLieu
```

---

## 14. ROADMAP & FUTURE ENHANCEMENTS

### Phase 2 (Future)

- [ ] **Workflow duyệt phiếu**: Thêm bước Chờ duyệt → Đã duyệt
- [ ] **Barcode/QR Code**: Scan vật liệu khi nhập/xuất
- [ ] **Mobile App**: Ứng dụng di động cho nhân viên kho
- [ ] **Alert System**: Email/SMS cảnh báo tồn kho thấp
- [ ] **BI Dashboard**: Power BI integration
- [ ] **API RESTful**: Expose data qua REST API
- [ ] **Batch Operations**: Nhập/xuất hàng loạt
- [ ] **Expiry Tracking**: Cảnh báo vật liệu sắp hết hạn

---

## 15. CONTACT & SUPPORT

### Technical Owner

- **Module**: VMS Warehouse Management System
- **Version**: 1.0
- **Last Updated**: 2026-01-15

### Documentation

- Database Schema: `VMS_WAREHOUSE_MODULE.sql`
- Business Logic: `VMS_WAREHOUSE_BUSINESS_LOGIC.md` (this file)

---

## APPENDIX A: SAMPLE DATA SCRIPTS

```sql
-- Thêm vật liệu mẫu
INSERT INTO VatLieu (MaVatLieu, TenVatLieu, NhomVatLieuId, DonViTinhId, MucToiThieu, MucToiDa)
VALUES
    (N'XICH-10MM-001', N'Xích phao 10mm', 1, 3, 50, 500),
    (N'DEN-LED-001', N'Đèn LED báo hiệu', 3, 1, 20, 200),
    (N'SON-CR-001', N'Sơn chống rỉ', 4, 8, 100, 1000);

-- Thêm tồn kho ban đầu
INSERT INTO TonKho (VatLieuId, KhoId, SoLuongTon, ViTri)
VALUES
    (1, 1, 300, N'A1-T2'),  -- Kho Mẹ
    (2, 1, 150, N'B3-T1'),
    (3, 1, 500, N'C2-T3');
```

---

**END OF DOCUMENTATION**

_Generated by Senior BigTech Architect_  
_Reviewed & Optimized for Production_
