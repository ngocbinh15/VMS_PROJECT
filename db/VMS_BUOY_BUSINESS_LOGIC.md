# 🚢 HỆ THỐNG QUẢN LÝ VÒNG ĐỜI PHAO BÁO HIỆU HÀNG HẢI - VMS BUOY MODULE

## Business Logic & Technical Documentation

---

## 📋 MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Kiến trúc dữ liệu](#2-kiến-trúc-dữ-liệu)
3. [Quy ước đặt tên phao](#3-quy-ước-đặt-tên-phao)
4. [Quản lý vị trí & luồng](#4-quản-lý-vị-trí--luồng)
5. [Lịch sử hoạt động phao](#5-lịch-sử-hoạt-động-phao)
6. [Báo cáo chính](#6-báo-cáo-chính)
7. [API & Stored Procedures](#7-api--stored-procedures)
8. [Use Cases & Examples](#8-use-cases--examples)
9. [Tích hợp với Module Kho](#9-tích-hợp-với-module-kho)
10. [Performance & Optimization](#10-performance--optimization)

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Mục đích

Module quản lý phao báo hiệu hàng hải được thiết kế để:

- **Quản lý vòng đời hoàn chỉnh** của phao từ lúc nhận → vận hành → bảo trì → thanh lý
- **Theo dõi lịch sử di chuyển** phao qua các vị trí báo hiệu (Phao BH) trên các tuyến luồng
- **Báo cáo theo 2 chiều**: Theo loại phao (D24, T26...) và theo luồng (QN, ĐTN, PQ...)
- **Quản lý thiết bị** đèn, xích, rùa neo của từng phao
- **Tích hợp kho vật tư** để theo dõi vật liệu sử dụng cho bảo dưỡng phao

### 1.2 Đối tượng quản lý

```
PHAO BÁO HIỆU HÀNG HẢI (Navigational Buoy)
│
├── Thông tin định danh
│   ├── Ký hiệu tài sản (KCHT40861)
│   ├── Mã phao đầy đủ (D24.020.16) ← TÊN PHAO
│   └── Loại phao (D24) ← Tự động lấy từ mã phao
│
├── Thông tin kỹ thuật
│   ├── Đường kính, chiều cao, hình dạng
│   ├── Vật liệu, màu sắc
│   └── Hình ảnh, bản vẽ
│
├── Thiết bị đèn báo hiệu
│   ├── Chủng loại đèn, kết nối AIS
│   ├── Đặc tính ánh sáng, chiếu xa
│   ├── Nguồn cấp năng lượng (pin/ắc quy)
│   └── Lịch sử sửa chữa, quyết định tặng
│
├── Xích & Rùa neo
│   ├── Xích phao: Đường kính, chiều dài
│   ├── Xích rùa: Đường kính, chiều dài
│   └── Rùa neo: Trọng lượng, ngày lắp đặt
│
└── Lịch sử hoạt động
    ├── Trên luồng tại vị trí nào
    ├── Thu hồi về bãi
    ├── Bảo trì/sửa chữa
    └── Cho thuê, thanh lý
```

### 1.3 Yêu cầu nghiệp vụ chính

| **Yêu cầu**              | **Mô tả**                                                                       | **Độ ưu tiên** |
| ------------------------ | ------------------------------------------------------------------------------- | -------------- |
| **Snapshot Pattern**     | Lưu trạng thái phao theo thời gian (MaPhaoBH, MaTuyenLuong)                     | ⭐⭐⭐⭐⭐     |
| **Pivot Reporting**      | Báo cáo dạng matrix theo năm (2014, 2015, 2016...)                              | ⭐⭐⭐⭐⭐     |
| **Auto-extraction**      | Tự động lấy loại phao từ mã phao đầy đủ                                         | ⭐⭐⭐⭐⭐     |
| **Multi-state Tracking** | Theo dõi 6 trạng thái: Trên luồng, Thu hồi, Trên bãi, Cho thuê, Thanh lý, Sự cố | ⭐⭐⭐⭐       |
| **Equipment History**    | Lịch sử thay đổi thiết bị (đèn, xích, rùa)                                      | ⭐⭐⭐⭐       |
| **Maintenance Logs**     | Nhật ký bảo trì, chi phí, nhân sự                                               | ⭐⭐⭐⭐       |

### 1.4 Người dùng hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                        ADMIN (CapDo = 2)                    │
│  • Toàn quyền quản lý phao                                  │
│  • Xem tất cả dữ liệu                                      │
│  • Cấu hình hệ thống                                       │
└─────────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPERVISOR (CapDo = 1)                    │
│  • Xem tất cả lịch sử phao                                 │
│  • Xem báo cáo tổng hợp                                    │
│  • Duyệt bảo trì/sửa chữa                                  │
└─────────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      STAFF (CapDo = 0)                      │
│  • Nhập lịch sử hoạt động phao                             │
│  • Xem CHỈ dữ liệu MÌNH nhập                               │
│  • Cập nhật thông tin bảo trì                              │
└─────────────────────────────────────────────────────────────┘
```

**Lưu ý phân quyền:**

- Bảng `NguoiDung` có cột `BoPhan`:
  - `BoPhan = 'PHAO'`: User thuộc module Quản lý Phao
  - `BoPhan = 'KHO'`: User thuộc module Quản lý Kho (toàn quyền, CapDo vô nghĩa)

---

## 2. KIẾN TRÚC DỮ LIỆU

### 2.1 ERD - Entity Relationship Diagram

```
┌──────────────────┐         1:N        ┌─────────────────────┐
│  DmTuyenLuong    │◄────────────────────│  DmViTriPhaoBH      │
│                  │                     │                     │
│ • MaTuyen (QN)   │                     │ • MaPhaoBH ("4A"-QN)│
│ • TenTuyen       │                     │ • SoViTri (4A)      │
└──────────────────┘                     │ • ToaDoThietKe      │
                                         └─────────────────────┘
                                                   │
                                                   │ 1:N
                                                   ▼
┌──────────────────┐         1:N        ┌─────────────────────┐
│  DmTramQuanLy    │◄────────────────────│      Phao           │
│                  │                     │                     │
│ • MaTram         │                     │ • MaPhaoDayDu ★     │
│ • TenTram        │                     │ • MaLoaiPhao (*)    │
└──────────────────┘                     │ • KyHieuTaiSan      │
                                         │ • TrangThaiHienTai  │
┌──────────────────┐                     │ • ViTriPhaoBHHienTaiId│
│ DmDonViVanHanh   │                     └─────────────────────┘
│                  │                               │
│ • MaDonVi        │                               │ 1:N
│ • TenDonVi       │                               ▼
└──────────────────┘              ┌──────────────────────────────┐
                                  │  LichSuHoatDongPhao          │
                                  │                              │
                                  │ • Nam (2014, 2015...)        │
                                  │ • NgayBatDau / NgayKetThuc   │
                                  │ • LoaiTrangThai              │
                                  │ • MaPhaoBH (snapshot)        │
                                  │ • MaTuyenLuong (snapshot)    │
                                  │ • ViTriPhaoBHId              │
                                  └──────────────────────────────┘
                                                   │
                                                   │ 1:N
                                  ┌────────────────┴──────────────┐
                                  ▼                               ▼
                        ┌──────────────────┐       ┌──────────────────────┐
                        │ LichSuBaoTri     │       │ LichSuThayDoiThietBi │
                        │                  │       │                      │
                        │ • LoaiCongViec   │       │ • LoaiThietBi        │
                        │ • ChiPhiUocTinh  │       │ • ThongSoCu/Moi      │
                        │ • ChiPhiThucTe   │       │ • LyDoThayDoi        │
                        └──────────────────┘       └──────────────────────┘
```

**Chú thích:**

- `★` TÊN PHAO = MaPhaoDayDu (D24.020.16)
- `(*)` Computed column PERSISTED

### 2.2 Các bảng chính

#### **2.2.1 Danh mục cơ bản**

| Bảng             | Mục đích                          | Dữ liệu mẫu                   |
| ---------------- | --------------------------------- | ----------------------------- |
| `DmTuyenLuong`   | Tuyến luồng hàng hải              | QN, ĐTN, NT, BN, PT, PQ, CNV  |
| `DmViTriPhaoBH`  | Vị trí Phao BH cố định trên luồng | "0"-QN, "4A"-QN, "P1"-PQ      |
| `DmTramQuanLy`   | Trạm quản lý phao                 | Trạm QLBH Quy Nhơn, Nha Trang |
| `DmDonViVanHanh` | Đơn vị vận hành                   | Công ty BĐATHH Nam Trung Bộ   |

**Ví dụ vị trí Phao BH trên luồng Quy Nhơn (QN):**

```
Luồng QN:
  "0"-QN, "1"-QN, "2"-QN, "3"-QN, "3A"-QN, "4"-QN,
  "4A"-QN, "5"-QN, "6"-QN, "7"-QN, "8"-QN, "9"-QN,
  "10"-QN, "11"-QN, "15"-QN, "PC"-QN
```

#### **2.2.2 Bảng Phao (Master Data)**

```sql
CREATE TABLE Phao (
    -- Định danh
    KyHieuTaiSan       -- VD: KCHT40861
    MaPhaoDayDu        -- VD: D24.020.16 (TÊN PHAO)
    MaLoaiPhao         -- Computed: D24 (Tự động lấy từ MaPhaoDayDu)
    TenPhao            -- Mô tả bổ sung (tùy chọn, có thể NULL)
    SoPhaoHienTai      -- STT: 1, 2, 3...

    -- Kỹ thuật
    DuongKinhPhao, ChieuCaoToanBo, HinhDang, VatLieu, MauSac

    -- Xích & Rùa
    XichPhao_DuongKinh, XichPhao_ChieuDai, XichPhao_ThoiDiemSuDung
    XichRua_DuongKinh, XichRua_ChieuDai, XichRua_ThoiDiemSuDung
    Rua_TrongLuong, Rua_ThoiDiemSuDung

    -- Đèn báo hiệu
    Den_ChungLoai, Den_KetNoiAIS, Den_DacTinhAnhSang
    Den_ChieuXaTamSang, Den_NguonCapNangLuong
    Den_ThoiDiemSuDung, Den_ThoiDiemSuaChua

    -- Trạng thái hiện tại (cache)
    TrangThaiHienTai          -- Cache để query nhanh
    ViTriPhaoBHHienTaiId      -- FK → DmViTriPhaoBH
)
```

**Computed Column quan trọng:**

```sql
MaLoaiPhao AS (LEFT(MaPhaoDayDu, CHARINDEX('.', MaPhaoDayDu) - 1)) PERSISTED

-- Ví dụ:
-- D24.020.16  → D24
-- DN24.037.02 → DN24
-- T26.016.09  → T26
-- T20.012.05  → T20
```

#### **2.2.3 Bảng LichSuHoatDongPhao (Core Table)**

Đây là bảng **QUAN TRỌNG NHẤT**, lưu mọi trạng thái phao theo thời gian:

```sql
CREATE TABLE LichSuHoatDongPhao (
    PhaoId

    -- Thời gian
    Nam                 -- 2014, 2015, 2016...
    NgayBatDau          -- Ngày bắt đầu trạng thái
    NgayKetThuc         -- NULL = Đang diễn ra

    -- Trạng thái
    LoaiTrangThai       -- TREN_LUONG, THU_HOI, TREN_BAI, CHO_THUE, XIN_THANH_LY, SU_CO
    MoTaTrangThai       -- "P1-PQ", "Trên bãi Phú Quý", "Thu hồi về"

    -- Snapshot vị trí (lưu lại tại thời điểm đó)
    ViTriPhaoBHId       -- FK → DmViTriPhaoBH
    MaPhaoBH            -- Snapshot: "4A"-QN
    MaTuyenLuong        -- Snapshot: QN

    -- Tọa độ thực tế
    KinhDo, ViDo
    DiaDiem             -- "Bãi Phú Quý", "Kho Pquy"
)
```

**Tại sao cần Snapshot?**

Phao có thể di chuyển qua nhiều tuyến luồng:

```
2014: Phao D24.020.16 ở "4A"-QN (Luồng Quy Nhơn)
2015: Phao D24.020.16 chuyển sang "P1"-PQ (Luồng Phú Quý)
2016: Phao D24.020.16 về bãi Nha Trang
```

Nếu không lưu snapshot, khi vị trí "4A"-QN bị xóa hoặc đổi tên → mất lịch sử!

---

## 3. QUY ƯỚC ĐẶT TÊN PHAO

### 3.1 Cấu trúc mã phao

```
MaPhaoDayDu = [LoaiPhao].[STT].[Năm]

Ví dụ:
D24.020.16
│   │   │
│   │   └─ Năm: 2016
│   └───── STT: 020
└───────── Loại phao: D24
```

### 3.2 Các loại phao phổ biến

| Loại phao | Mô tả           | Ví dụ                  |
| --------- | --------------- | ---------------------- |
| **D24**   | Phao đỏ 24m     | D24.006.04, D24.020.16 |
| **DN24**  | Phao đỏ nổi 24m | DN24.037.02            |
| **T26**   | Phao trụ 26m    | T26.016.09             |
| **T20**   | Phao trụ 20m    | T20.012.05             |
| **X24**   | Phao xanh 24m   | X24.008.10             |

### 3.3 Tự động trích xuất loại phao

Hệ thống sử dụng **Computed Column** để tự động lấy loại phao:

```sql
-- Khi INSERT
INSERT INTO Phao (KyHieuTaiSan, MaPhaoDayDu, SoPhaoHienTai)
VALUES ('KCHT40861', 'D24.020.16', 1)

-- Hệ thống TỰ ĐỘNG tính:
MaLoaiPhao = 'D24'  -- Lấy từ LEFT(MaPhaoDayDu, CHARINDEX('.', ...))
```

**Lợi ích:**
✓ Không cần nhập thủ công loại phao  
✓ Không cần bảng `DmLoaiPhao`  
✓ Tự động đồng bộ khi đổi tên phao  
✓ Có thể index để query nhanh

---

## 4. QUẢN LÝ VỊ TRÍ & LUỒNG

### 4.1 Mô hình vị trí Phao BH

```
LUỒNG QUY NHƠN (QN)
════════════════════════════════════════
   "0"-QN   "1"-QN   "2"-QN   "3"-QN   "3A"-QN
     │        │        │        │         │
     ▼        ▼        ▼        ▼         ▼
   [Phao1] [Phao2] [Phao3] [Phao4]   [Phao5]
   D24.006  T26.016  D24.020  DN24.037  T20.012

   "4"-QN   "4A"-QN  "5"-QN   ...      "PC"-QN
     │        │        │                  │
     ▼        ▼        ▼                  ▼
   [Phao6] [Phao7] [Phao8]            [PhaoN]
```

**Quy tắc:**

- Mỗi vị trí Phao BH có mã UNIQUE: `"4A"-QN` (số vị trí + tên luồng)
- Một vị trí chỉ có TỐI ĐA 1 phao tại 1 thời điểm
- Phao có thể di chuyển giữa các vị trí hoặc về bãi

### 4.2 Các tuyến luồng

| Mã luồng | Tên luồng                 | Số vị trí Phao BH |
| -------- | ------------------------- | ----------------- |
| **QN**   | Luồng Quy Nhơn            | 16 vị trí         |
| **ĐTN**  | Luồng Dung Quất - Tiên Sa | 5 vị trí          |
| **NT**   | Luồng Nha Trang           | -                 |
| **BN**   | Luồng Bình Ninh           | -                 |
| **PT**   | Luồng Phan Thiết          | -                 |
| **PQ**   | Luồng Phú Quý             | 6 vị trí (P0-P5)  |
| **CNV**  | Luồng Cam Ranh - Vạn Ninh | -                 |

### 4.3 Trạng thái phao

```sql
LoaiTrangThai:
  'TREN_LUONG'      -- Đang hoạt động trên luồng
  'THU_HOI'         -- Thu hồi về trạm
  'TREN_BAI'        -- Đang ở bãi (chờ bảo trì, chờ lắp đặt)
  'CHO_THUE'        -- Cho thuê cho đơn vị khác
  'XIN_THANH_LY'    -- Đề xuất thanh lý
  'SU_CO'           -- Gặp sự cố (hỏng, trôi...)
```

**Workflow điển hình:**

```
┌───────────────┐
│  Nhận phao mới│
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   TREN_BAI    │ ← Phao ở bãi chờ lắp đặt
└───────┬───────┘
        │
        ▼
┌───────────────┐
│  TREN_LUONG   │ ← Lắp đặt tại "4A"-QN
└───────┬───────┘
        │
        ├─────► THU_HOI ───► TREN_BAI ───► Bảo trì ───► TREN_LUONG
        │
        ├─────► SU_CO ───► THU_HOI ───► Sửa chữa ───► TREN_LUONG
        │
        └─────► XIN_THANH_LY ───► Thanh lý
```

---

## 5. LỊCH SỬ HOẠT ĐỘNG PHAO

### 5.1 Snapshot Pattern

Hệ thống lưu **trạng thái snapshot** tại mỗi thời điểm:

```sql
-- Phao D24.020.16 năm 2014-2015
INSERT INTO LichSuHoatDongPhao VALUES
(PhaoId=1, Nam=2014, NgayBatDau='2014-01-01', NgayKetThuc='2015-12-31',
 LoaiTrangThai='TREN_LUONG', MoTaTrangThai='4A-QN',
 MaPhaoBH='"4A"-QN', MaTuyenLuong='QN', ViTriPhaoBHId=7)

-- Chuyển sang luồng khác năm 2016
INSERT INTO LichSuHoatDongPhao VALUES
(PhaoId=1, Nam=2016, NgayBatDau='2016-01-01', NgayKetThuc=NULL,
 LoaiTrangThai='TREN_LUONG', MoTaTrangThai='P1-PQ',
 MaPhaoBH='P1-PQ', MaTuyenLuong='PQ', ViTriPhaoBHId=45)
```

**Tại sao snapshot?**

- Lưu `MaPhaoBH` và `MaTuyenLuong` STRING → Không bị ảnh hưởng khi master data thay đổi
- Tra cứu lịch sử chính xác: "Năm 2014, phao này ở đâu?"
- Hỗ trợ báo cáo pivot theo năm

### 5.2 Ví dụ lịch sử chi tiết

**Phao D24.020.16 - Lịch sử 2014-2018:**

| Năm  | Trạng thái | Mô tả       | Vị trí  | Luồng | Ghi chú               |
| ---- | ---------- | ----------- | ------- | ----- | --------------------- |
| 2014 | TREN_LUONG | 4A-QN       | "4A"-QN | QN    | Hoạt động bình thường |
| 2015 | TREN_LUONG | 4A-QN       | "4A"-QN | QN    | Hoạt động bình thường |
| 2016 | THU_HOI    | Thu hồi về  | NULL    | NULL  | Bảo trì đèn           |
| 2016 | TREN_BAI   | Trên bãi NT | NULL    | NULL  | Chờ linh kiện         |
| 2017 | TREN_LUONG | P1-PQ       | P1-PQ   | PQ    | Chuyển sang luồng PQ  |
| 2018 | SU_CO      | Trôi do bão | NULL    | NULL  | Mất tín hiệu          |

### 5.3 Query lịch sử

```sql
-- Xem lịch sử 1 phao
SELECT
    Nam,
    LoaiTrangThai,
    MoTaTrangThai,
    MaPhaoBH,
    MaTuyenLuong,
    NgayBatDau,
    NgayKetThuc
FROM LichSuHoatDongPhao
WHERE PhaoId = 1
ORDER BY Nam, NgayBatDau
```

---

## 6. BÁO CÁO CHÍNH

### 6.1 Báo cáo 1: Lịch sử theo LOẠI PHAO

**Mục đích:** Xem tất cả phao cùng loại (D24) đã hoạt động như thế nào qua các năm

**Dạng hiển thị:** Matrix (Pivot Table)

```
LOẠI PHAO: D24
═══════════════════════════════════════════════════════════════
Mã phao      | STT | 2014    | 2015    | 2016      | 2017    | 2018
─────────────┼─────┼─────────┼─────────┼───────────┼─────────┼──────────
D24.006.04   | 1   | 0-QN    | 0-QN    | Thu hồi   | 0-QN    | 0-QN
D24.020.16   | 2   | 4A-QN   | 4A-QN   | Bảo trì   | P1-PQ   | Trôi
D24.008.10   | 3   | 1-QN    | 1-QN    | 1-QN      | 1-QN    | Thanh lý
```

**View:**

```sql
CREATE VIEW vw_BaoCao_LichSuTheoLoaiPhao AS
SELECT
    p.MaLoaiPhao,          -- D24, DN24, T26...
    p.MaPhaoDayDu,         -- D24.020.16
    p.SoPhaoHienTai,       -- STT
    ls.Nam,                -- 2014, 2015...
    ls.MoTaTrangThai       -- Hiển thị trong ô
FROM LichSuHoatDongPhao ls
INNER JOIN Phao p ON ls.PhaoId = p.Id
```

**Stored Procedure:**

```sql
EXEC sp_BaoCao_LichSuTheoLoaiPhao @MaLoaiPhao = 'D24'
-- Trả về: Tất cả phao D24 với lịch sử theo năm
```

### 6.2 Báo cáo 2: Lịch sử theo LUỒNG

**Mục đích:** Xem tất cả vị trí Phao BH trên luồng QN, phao nào đã ở vị trí đó qua các năm

**Dạng hiển thị:** Matrix (Pivot Table)

```
LUỒNG: Quy Nhơn (QN)
═══════════════════════════════════════════════════════════════
Vị trí    | 2014       | 2015       | 2016       | 2017       | 2018
──────────┼────────────┼────────────┼────────────┼────────────┼──────────
"0"-QN    | D24.006.04 | D24.006.10 | (Trống)    | D24.006.04 | D24.006.04
"1"-QN    | D24.008.10 | D24.008.04 | D24.008.10 | D24.008.10 | (Thanh lý)
"4A"-QN   | D24.020.16 | D24.020.16 | (Thu hồi)  | (Trống)    | T26.016.09
"P1"-PQ   | -          | -          | -          | D24.020.16 | (Trôi)
```

**View:**

```sql
CREATE VIEW vw_BaoCao_LichSuTheoLuong AS
SELECT
    tl.MaTuyen AS MaTuyenLuong,  -- QN, ĐTN, PQ...
    vt.SoViTri,                   -- "0", "4A", "P1"...
    vt.MaPhaoBH,                  -- "0"-QN, "4A"-QN
    ls.Nam,                       -- 2014, 2015...
    p.MaPhaoDayDu,                -- Phao nào ở đây (D24.020.16)
    ls.MoTaTrangThai              -- Trạng thái chi tiết
FROM DmViTriPhaoBH vt
INNER JOIN DmTuyenLuong tl ON vt.TuyenLuongId = tl.Id
LEFT JOIN LichSuHoatDongPhao ls ON vt.Id = ls.ViTriPhaoBHId
LEFT JOIN Phao p ON ls.PhaoId = p.Id
WHERE ls.LoaiTrangThai IN ('TREN_LUONG', 'THU_HOI') OR ls.LoaiTrangThai IS NULL
```

**Stored Procedure:**

```sql
EXEC sp_BaoCao_LichSuTheoLuong @MaTuyenLuong = 'QN'
-- Trả về: Tất cả vị trí trên luồng QN với lịch sử phao
```

### 6.3 Báo cáo bổ sung

| Báo cáo          | Mục đích                  | SP/View                          |
| ---------------- | ------------------------- | -------------------------------- |
| Phao sắp bảo trì | Xích/Rùa sắp đến hạn thay | Custom query                     |
| Đèn hết hạn      | Đèn cần thay thế          | Custom query                     |
| Chi phí bảo trì  | Thống kê chi phí theo năm | Aggregate từ `LichSuBaoTri`      |
| Phao trôi/mất    | Phao có sự cố             | Filter `LoaiTrangThai = 'SU_CO'` |

---

## 7. API & STORED PROCEDURES

### 7.1 Quản lý lịch sử phao

#### **sp_ThemLichSuHoatDong**

Thêm bản ghi lịch sử mới cho phao:

```sql
CREATE PROCEDURE sp_ThemLichSuHoatDong
    @PhaoId INT,
    @Nam INT,
    @NgayBatDau DATE,
    @NgayKetThuc DATE = NULL,
    @LoaiTrangThai NVARCHAR(20),
    @MoTaTrangThai NVARCHAR(200) = NULL,
    @ViTriPhaoBHId INT = NULL,
    @DiaDiem NVARCHAR(200) = NULL,
    @KinhDo NVARCHAR(50) = NULL,
    @ViDo NVARCHAR(50) = NULL,
    @GhiChu NVARCHAR(MAX) = NULL,
    @NguoiTao NVARCHAR(100) = NULL
```

**Logic:**

1. Lấy thông tin `MaPhaoBH` và `MaTuyenLuong` từ `@ViTriPhaoBHId`
2. INSERT vào `LichSuHoatDongPhao` với snapshot
3. Nếu `@NgayKetThuc IS NULL` → Cập nhật `Phao.TrangThaiHienTai`

**Ví dụ:**

```sql
EXEC sp_ThemLichSuHoatDong
    @PhaoId = 1,
    @Nam = 2024,
    @NgayBatDau = '2024-01-15',
    @LoaiTrangThai = 'TREN_LUONG',
    @MoTaTrangThai = '4A-QN',
    @ViTriPhaoBHId = 7,  -- FK đến DmViTriPhaoBH
    @KinhDo = '109.123456',
    @ViDo = '13.654321',
    @NguoiTao = 'NV_QuanLyPhao'
```

#### **sp_ChuyenPhaoSangViTri**

Chuyển phao từ vị trí này sang vị trí khác:

```sql
CREATE PROCEDURE sp_ChuyenPhaoSangViTri
    @PhaoId INT,
    @ViTriPhaoBHMoi INT,
    @NgayChuyenDoi DATE,
    @MoTaTrangThai NVARCHAR(200) = NULL,
    @GhiChu NVARCHAR(MAX) = NULL,
    @NguoiTao NVARCHAR(100) = NULL
```

**Logic:**

1. **ĐÓNG** lịch sử hiện tại: `UPDATE ... SET NgayKetThuc = @NgayChuyenDoi WHERE NgayKetThuc IS NULL`
2. **TẠO** lịch sử mới tại vị trí mới
3. **CẬP NHẬT** `Phao.ViTriPhaoBHHienTaiId`

**Ví dụ:**

```sql
-- Chuyển phao D24.020.16 từ "4A"-QN sang "P1"-PQ
EXEC sp_ChuyenPhaoSangViTri
    @PhaoId = 1,
    @ViTriPhaoBHMoi = 45,  -- "P1"-PQ
    @NgayChuyenDoi = '2024-06-01',
    @MoTaTrangThai = 'Điều chuyển sang luồng PQ',
    @NguoiTao = 'Admin'
```

### 7.2 Functions

#### **fn_LayTrangThaiPhaoTheoNam**

Lấy trạng thái phao tại 1 năm cụ thể:

```sql
CREATE FUNCTION fn_LayTrangThaiPhaoTheoNam
(
    @PhaoId INT,
    @Nam INT
)
RETURNS TABLE
AS
RETURN
(
    SELECT TOP 1
        LoaiTrangThai,
        MoTaTrangThai,
        MaPhaoBH,
        MaTuyenLuong
    FROM LichSuHoatDongPhao
    WHERE PhaoId = @PhaoId
      AND Nam = @Nam
    ORDER BY NgayBatDau DESC
)
```

**Sử dụng:**

```sql
-- Phao D24.020.16 năm 2015 ở đâu?
SELECT * FROM fn_LayTrangThaiPhaoTheoNam(1, 2015)
-- Kết quả: LoaiTrangThai='TREN_LUONG', MoTaTrangThai='4A-QN'
```

#### **fn_LayPhaoDangOViTriTheoNgay**

Lấy phao đang ở vị trí Phao BH tại ngày cụ thể:

```sql
CREATE FUNCTION fn_LayPhaoDangOViTriTheoNgay
(
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
        ls.MoTaTrangThai
    FROM LichSuHoatDongPhao ls
    INNER JOIN Phao p ON ls.PhaoId = p.Id
    WHERE ls.ViTriPhaoBHId = @ViTriPhaoBHId
      AND @NgayKiemTra >= ls.NgayBatDau
      AND (@NgayKiemTra <= ls.NgayKetThuc OR ls.NgayKetThuc IS NULL)
    ORDER BY ls.NgayBatDau DESC
)
```

**Sử dụng:**

```sql
-- Vị trí "4A"-QN ngày 15/01/2024 có phao nào?
SELECT * FROM fn_LayPhaoDangOViTriTheoNgay(7, '2024-01-15')
```

---

## 8. WORKFLOW: THÊM HOẠT ĐỘNG PHAO (UI → BACKEND)

### 8.1 Tổng quan nghiệp vụ

Đây là chức năng **QUAN TRỌNG NHẤT** cho người dùng thao tác hàng ngày. Cho phép ghi nhận hoạt động phao lên luồng với **validation chặt chẽ** để tránh xung đột.

#### **Màn hình UI - Form "Thêm hoạt động phao"**

```
┌─────────────────────────────────────────────────────────────┐
│  THÊM HOẠT ĐỘNG PHAO                                   [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Chọn Phao: [Dropdown]                                     │
│  ┌────────────────────────────────────────────┐            │
│  │ D24.020.16 (STT: 1) - Đang ở bãi          │◄── Load từ DB │
│  │ DN24.037.02 (STT: 2) - Đang ở bãi         │            │
│  │ T26.016.09 (STT: 3) - Đang thu hồi        │            │
│  └────────────────────────────────────────────┘            │
│                                                             │
│  Chọn Tuyến Luồng: [Dropdown]                             │
│  ┌────────────────────────────────────────────┐            │
│  │ QN - Luồng Quy Nhơn                        │◄── Load từ DB │
│  │ ĐTN - Luồng Dung Quất - Tiên Sa           │            │
│  │ PQ - Luồng Phú Quý                         │            │
│  └────────────────────────────────────────────┘            │
│                                                             │
│  Chọn Vị trí Phao BH: [Dropdown]                          │
│  ┌────────────────────────────────────────────┐            │
│  │ "0"-QN (Trống ✓)                           │◄── Load theo tuyến │
│  │ "4A"-QN (Đã có: D24.006.04 ✗)             │            │
│  │ "5"-QN (Trống ✓)                           │            │
│  └────────────────────────────────────────────┘            │
│                                                             │
│  Ngày lắp đặt: [2024-01-16] ◄ DatePicker                  │
│                                                             │
│  Ghi chú: [Textarea]                                       │
│  ┌────────────────────────────────────────────┐            │
│  │ Lắp đặt phao mới sau bảo trì               │            │
│  └────────────────────────────────────────────┘            │
│                                                             │
│               [Hủy]  [Lưu Hoạt Động]                       │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Workflow Backend - 5 bước xử lý

```
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 1: LOAD DỮ LIỆU DROPDOWN                              │
├─────────────────────────────────────────────────────────────┤
│ API: GET /api/phao/dropdown                                 │
│ → Lấy danh sách phao CÓ THỂ lắp lên luồng                  │
│                                                             │
│ SELECT Id, MaPhaoDayDu, SoPhaoHienTai, TrangThaiHienTai    │
│ FROM Phao                                                   │
│ WHERE TrangThaiHienTai IN (N'Trên bãi', N'Thu hồi')        │
│   AND Id NOT IN (                                          │
│       SELECT PhaoId FROM LichSuHoatDongPhao                │
│       WHERE LoaiTrangThai = 'TREN_LUONG'                   │
│         AND NgayKetThuc IS NULL  -- Đang ở trên luồng      │
│   )                                                        │
│ ORDER BY MaPhaoDayDu                                       │
└─────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 2: LOAD TUYẾN LUỒNG                                   │
├─────────────────────────────────────────────────────────────┤
│ API: GET /api/tuyenluong                                    │
│                                                             │
│ SELECT Id, MaTuyen, TenTuyen                               │
│ FROM DmTuyenLuong                                          │
│ WHERE TrangThai = N'Hoạt động'                             │
│ ORDER BY ThuTuHienThi                                      │
└─────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 3: LOAD VỊ TRÍ PHAO BH THEO TUYẾN (AJAX)             │
├─────────────────────────────────────────────────────────────┤
│ API: GET /api/vitri/by-tuyen/{tuyenId}                     │
│ → Khi user chọn tuyến luồng → Load vị trí + trạng thái     │
│                                                             │
│ SP: sp_LayViTriPhaoBH_TheoTuyen                            │
│                                                             │
│ SELECT                                                      │
│     vt.Id,                                                 │
│     vt.SoViTri,                                            │
│     vt.MaPhaoBH,                                           │
│     -- Kiểm tra có phao đang ở đây không                   │
│     p.Id AS PhaoHienTaiId,                                 │
│     p.MaPhaoDayDu AS PhaoHienTai,                          │
│     CASE                                                    │
│         WHEN p.Id IS NULL THEN 1  -- Trống                 │
│         ELSE 0                     -- Đã có phao           │
│     END AS CoTheChon                                       │
│ FROM DmViTriPhaoBH vt                                      │
│ LEFT JOIN LichSuHoatDongPhao ls ON vt.Id = ls.ViTriPhaoBHId│
│     AND ls.LoaiTrangThai = 'TREN_LUONG'                    │
│     AND ls.NgayKetThuc IS NULL  -- Đang hoạt động          │
│ LEFT JOIN Phao p ON ls.PhaoId = p.Id                       │
│ WHERE vt.TuyenLuongId = @TuyenLuongId                      │
│ ORDER BY vt.ThuTuHienThi                                   │
└─────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 4: VALIDATE TRƯỚC KHI LƯU                             │
├─────────────────────────────────────────────────────────────┤
│ API: POST /api/phao/hoatdong/validate                      │
│ Body: { phaoId, viTriPhaoBHId, ngayLapDat }                │
│                                                             │
│ SP: sp_ValidateThemHoatDongPhao                            │
│                                                             │
│ CREATE PROCEDURE sp_ValidateThemHoatDongPhao               │
│     @PhaoId INT,                                           │
│     @ViTriPhaoBHId INT,                                    │
│     @NgayLapDat DATE                                       │
│ AS                                                          │
│ BEGIN                                                       │
│     -- Check 1: Vị trí có phao khác đang ở đó không?      │
│     IF EXISTS (                                            │
│         SELECT 1                                           │
│         FROM LichSuHoatDongPhao                            │
│         WHERE ViTriPhaoBHId = @ViTriPhaoBHId              │
│           AND LoaiTrangThai = 'TREN_LUONG'                │
│           AND NgayKetThuc IS NULL                         │
│           AND PhaoId <> @PhaoId                           │
│     )                                                      │
│     BEGIN                                                  │
│         SELECT 0 AS IsValid,                              │
│                N'Vị trí này đã có phao khác!' AS Message, │
│                (SELECT p.MaPhaoDayDu                       │
│                 FROM LichSuHoatDongPhao ls                │
│                 INNER JOIN Phao p ON ls.PhaoId = p.Id    │
│                 WHERE ls.ViTriPhaoBHId = @ViTriPhaoBHId  │
│                   AND ls.NgayKetThuc IS NULL) AS PhaoHienTai│
│         RETURN                                            │
│     END                                                    │
│                                                            │
│     -- Check 2: Phao có đang ở luồng khác không?          │
│     IF EXISTS (                                            │
│         SELECT 1                                           │
│         FROM LichSuHoatDongPhao                            │
│         WHERE PhaoId = @PhaoId                            │
│           AND LoaiTrangThai = 'TREN_LUONG'                │
│           AND NgayKetThuc IS NULL                         │
│     )                                                      │
│     BEGIN                                                  │
│         SELECT 0 AS IsValid,                              │
│                N'Phao đang ở luồng khác!' AS Message,     │
│                (SELECT MaPhaoBH FROM LichSuHoatDongPhao   │
│                 WHERE PhaoId = @PhaoId                    │
│                   AND NgayKetThuc IS NULL) AS ViTriHienTai│
│         RETURN                                            │
│     END                                                    │
│                                                            │
│     -- Check 3: Ngày lắp đặt hợp lệ (không quá khứ xa)   │
│     IF @NgayLapDat < DATEADD(YEAR, -1, GETDATE())        │
│     BEGIN                                                  │
│         SELECT 0 AS IsValid,                              │
│                N'Ngày lắp đặt không hợp lệ!' AS Message  │
│         RETURN                                            │
│     END                                                    │
│                                                            │
│     -- PASS validation                                     │
│     SELECT 1 AS IsValid, N'Hợp lệ' AS Message            │
│ END                                                        │
└─────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 5: LƯU HOẠT ĐỘNG PHAO                                 │
├─────────────────────────────────────────────────────────────┤
│ API: POST /api/phao/hoatdong/create                        │
│ Body: {                                                     │
│     phaoId, viTriPhaoBHId, ngayLapDat, ghiChu, nguoiTao    │
│ }                                                           │
│                                                             │
│ SP: sp_ThemHoatDongPhao (Enhanced version)                 │
│                                                             │
│ CREATE PROCEDURE sp_ThemHoatDongPhao                       │
│     @PhaoId INT,                                           │
│     @ViTriPhaoBHId INT,                                    │
│     @NgayLapDat DATE,                                      │
│     @GhiChu NVARCHAR(MAX) = NULL,                         │
│     @NguoiTao NVARCHAR(100) = NULL                        │
│ AS                                                          │
│ BEGIN                                                       │
│     SET NOCOUNT ON;                                        │
│     BEGIN TRANSACTION;                                     │
│                                                             │
│     BEGIN TRY                                              │
│         -- 1. VALIDATE lần cuối (double-check)            │
│         DECLARE @IsValid BIT;                              │
│         DECLARE @Message NVARCHAR(500);                    │
│                                                             │
│         EXEC sp_ValidateThemHoatDongPhao                   │
│             @PhaoId = @PhaoId,                             │
│             @ViTriPhaoBHId = @ViTriPhaoBHId,              │
│             @NgayLapDat = @NgayLapDat                      │
│                                                             │
│         -- Lấy kết quả từ temp table hoặc output param     │
│         -- (Giả sử validate đã pass)                       │
│                                                             │
│         -- 2. ĐÓNG lịch sử cũ (nếu phao đang ở trạng thái khác)│
│         UPDATE LichSuHoatDongPhao                          │
│         SET NgayKetThuc = @NgayLapDat                      │
│         WHERE PhaoId = @PhaoId                            │
│           AND NgayKetThuc IS NULL;                        │
│                                                             │
│         -- 3. LẤY thông tin vị trí & tuyến                │
│         DECLARE @MaPhaoBH NVARCHAR(50);                    │
│         DECLARE @MaTuyenLuong NVARCHAR(50);                │
│         DECLARE @Nam INT = YEAR(@NgayLapDat);              │
│                                                             │
│         SELECT                                              │
│             @MaPhaoBH = vt.MaPhaoBH,                       │
│             @MaTuyenLuong = tl.MaTuyen                     │
│         FROM DmViTriPhaoBH vt                              │
│         INNER JOIN DmTuyenLuong tl ON vt.TuyenLuongId = tl.Id│
│         WHERE vt.Id = @ViTriPhaoBHId;                      │
│                                                             │
│         -- 4. THÊM lịch sử mới                            │
│         INSERT INTO LichSuHoatDongPhao (                   │
│             PhaoId, Nam, NgayBatDau, NgayKetThuc,         │
│             LoaiTrangThai, MoTaTrangThai,                 │
│             ViTriPhaoBHId, MaPhaoBH, MaTuyenLuong,        │
│             GhiChu, NguoiTao                              │
│         )                                                  │
│         VALUES (                                           │
│             @PhaoId, @Nam, @NgayLapDat, NULL,             │
│             N'TREN_LUONG',                                │
│             @MaPhaoBH,  -- VD: "4A"-QN                    │
│             @ViTriPhaoBHId, @MaPhaoBH, @MaTuyenLuong,     │
│             @GhiChu, @NguoiTao                            │
│         );                                                 │
│                                                             │
│         -- 5. CẬP NHẬT trạng thái hiện tại của phao       │
│         UPDATE Phao                                        │
│         SET TrangThaiHienTai = @MaPhaoBH,                 │
│             ViTriPhaoBHHienTaiId = @ViTriPhaoBHId,        │
│             NgayCapNhat = GETDATE()                       │
│         WHERE Id = @PhaoId;                               │
│                                                             │
│         COMMIT TRANSACTION;                                │
│                                                             │
│         SELECT 1 AS Success,                              │
│                N'Thêm hoạt động phao thành công!' AS Message,│
│                SCOPE_IDENTITY() AS LichSuId;              │
│     END TRY                                                │
│     BEGIN CATCH                                            │
│         ROLLBACK TRANSACTION;                              │
│         SELECT 0 AS Success,                              │
│                ERROR_MESSAGE() AS Message;                │
│     END CATCH                                              │
│ END                                                        │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Luồng xử lý Frontend (React/Angular/Vue)

```javascript
// ==========================================
// COMPONENT: ThemHoatDongPhaoForm.jsx
// ==========================================

import { useState, useEffect } from "react";

function ThemHoatDongPhaoForm() {
  const [danhSachPhao, setDanhSachPhao] = useState([]);
  const [danhSachTuyen, setDanhSachTuyen] = useState([]);
  const [danhSachViTri, setDanhSachViTri] = useState([]);

  const [formData, setFormData] = useState({
    phaoId: null,
    tuyenId: null,
    viTriId: null,
    ngayLapDat: new Date().toISOString().split("T")[0],
    ghiChu: "",
  });

  // STEP 1: Load danh sách phao
  useEffect(() => {
    fetch("/api/phao/dropdown")
      .then((res) => res.json())
      .then((data) => setDanhSachPhao(data));
  }, []);

  // STEP 2: Load danh sách tuyến luồng
  useEffect(() => {
    fetch("/api/tuyenluong")
      .then((res) => res.json())
      .then((data) => setDanhSachTuyen(data));
  }, []);

  // STEP 3: Load vị trí khi chọn tuyến
  useEffect(() => {
    if (formData.tuyenId) {
      fetch(`/api/vitri/by-tuyen/${formData.tuyenId}`)
        .then((res) => res.json())
        .then((data) => setDanhSachViTri(data));
    }
  }, [formData.tuyenId]);

  // STEP 4+5: Validate và Lưu
  const handleSubmit = async (e) => {
    e.preventDefault();

    // STEP 4: Validate
    const validateRes = await fetch("/api/phao/hoatdong/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phaoId: formData.phaoId,
        viTriPhaoBHId: formData.viTriId,
        ngayLapDat: formData.ngayLapDat,
      }),
    });

    const validateData = await validateRes.json();

    if (!validateData.isValid) {
      alert(
        `❌ Lỗi: ${validateData.message}\n` +
          `Phao hiện tại: ${validateData.phaoHienTai || "N/A"}`
      );
      return;
    }

    // STEP 5: Lưu
    const saveRes = await fetch("/api/phao/hoatdong/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phaoId: formData.phaoId,
        viTriPhaoBHId: formData.viTriId,
        ngayLapDat: formData.ngayLapDat,
        ghiChu: formData.ghiChu,
        nguoiTao: currentUser.username, // From auth context
      }),
    });

    const saveData = await saveRes.json();

    if (saveData.success) {
      alert("✅ " + saveData.message);
      // Reset form hoặc redirect
      window.location.href = "/phao/list";
    } else {
      alert("❌ " + saveData.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Chọn Phao */}
      <select
        value={formData.phaoId}
        onChange={(e) => setFormData({ ...formData, phaoId: e.target.value })}
        required
      >
        <option value="">-- Chọn phao --</option>
        {danhSachPhao.map((p) => (
          <option key={p.id} value={p.id}>
            {p.maPhaoDayDu} (STT: {p.soPhaoHienTai}) - {p.trangThaiHienTai}
          </option>
        ))}
      </select>

      {/* Chọn Tuyến */}
      <select
        value={formData.tuyenId}
        onChange={(e) =>
          setFormData({ ...formData, tuyenId: e.target.value, viTriId: null })
        }
        required
      >
        <option value="">-- Chọn tuyến luồng --</option>
        {danhSachTuyen.map((t) => (
          <option key={t.id} value={t.id}>
            {t.maTuyen} - {t.tenTuyen}
          </option>
        ))}
      </select>

      {/* Chọn Vị trí */}
      <select
        value={formData.viTriId}
        onChange={(e) => setFormData({ ...formData, viTriId: e.target.value })}
        required
        disabled={!formData.tuyenId}
      >
        <option value="">-- Chọn vị trí Phao BH --</option>
        {danhSachViTri.map((vt) => (
          <option
            key={vt.id}
            value={vt.id}
            disabled={!vt.coTheChon}
            style={{ color: vt.coTheChon ? "green" : "red" }}
          >
            {vt.maPhaoBH}
            {vt.coTheChon ? " (Trống ✓)" : ` (Đã có: ${vt.phaoHienTai} ✗)`}
          </option>
        ))}
      </select>

      {/* Ngày lắp đặt */}
      <input
        type="date"
        value={formData.ngayLapDat}
        onChange={(e) =>
          setFormData({ ...formData, ngayLapDat: e.target.value })
        }
        required
      />

      {/* Ghi chú */}
      <textarea
        value={formData.ghiChu}
        onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
        placeholder="Ghi chú (tùy chọn)"
      />

      <button type="submit">Lưu Hoạt Động</button>
    </form>
  );
}
```

### 8.4 Stored Procedures cần thiết

#### **sp_LayViTriPhaoBH_TheoTuyen** (Mới - cần thêm vào DB)

```sql
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
```

#### **sp_ValidateThemHoatDongPhao** (Mới - cần thêm vào DB)

```sql
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
    SET @IsValid = 1;  -- Mặc định là hợp lệ
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
```

#### **sp_ThemHoatDongPhao** (Enhanced từ sp_ThemLichSuHoatDong)

```sql
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
        INSERT INTO LichSuHoatDongPhao (
            PhaoId, Nam, NgayBatDau, NgayKetThuc,
            LoaiTrangThai, MoTaTrangThai,
            ViTriPhaoBHId, MaPhaoBH, MaTuyenLuong,
            GhiChu, NguoiTao, NgayTao
        )
        VALUES (
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
```

### 8.5 Tóm tắt Stored Procedures

| SP                            | Mục đích                            | Input                             | Output                        |
| ----------------------------- | ----------------------------------- | --------------------------------- | ----------------------------- |
| `sp_LayViTriPhaoBH_TheoTuyen` | Load vị trí + trạng thái theo tuyến | TuyenLuongId                      | Danh sách vị trí + CoTheChon  |
| `sp_ValidateThemHoatDongPhao` | Validate trước khi lưu              | PhaoId, ViTriPhaoBHId, NgayLapDat | IsValid, Message, PhaoHienTai |
| `sp_ThemHoatDongPhao`         | Lưu hoạt động phao lên luồng        | PhaoId, ViTriPhaoBHId, NgayLapDat | Success, Message, LichSuId    |

### 8.6 Error Messages

| Lỗi                  | Message                                    | Giải pháp                                    |
| -------------------- | ------------------------------------------ | -------------------------------------------- |
| Vị trí đã có phao    | "Vị trí "4A"-QN đã có phao D24.006.04!"    | Thu hồi phao cũ trước, hoặc chọn vị trí khác |
| Phao đang trên luồng | "Phao đang ở vị trí "5"-QN!"               | Thu hồi phao về bãi trước                    |
| Ngày tương lai       | "Ngày lắp đặt không được trong tương lai!" | Chọn ngày <= hôm nay                         |
| Ngày quá khứ xa      | "Ngày lắp đặt quá xa (> 2 năm)!"           | Kiểm tra lại ngày                            |

---

## 9. USE CASES & EXAMPLES

### Use Case 1: Nhập phao mới về quản lý

```sql
-- Bước 1: Thêm phao vào master
INSERT INTO Phao (
    KyHieuTaiSan, MaPhaoDayDu, SoPhaoHienTai,
    DuongKinhPhao, ChieuCaoToanBo, VatLieu, MauSac,
    TramQuanLyId, NgayNhanPhao, TrangThaiHienTai
)
VALUES (
    'KCHT50123',        -- Ký hiệu tài sản
    'D24.025.20',       -- Mã phao đầy đủ (TÊN PHAO)
    1,                  -- STT phao
    2.4,                -- Đường kính 2.4m
    3.5,                -- Chiều cao 3.5m
    N'Thép',
    N'Đỏ',
    1,                  -- Trạm Quy Nhơn
    '2024-01-10',
    N'Trên bãi'
)

DECLARE @PhaoId INT = SCOPE_IDENTITY()

-- Bước 2: Thêm lịch sử ban đầu
EXEC sp_ThemLichSuHoatDong
    @PhaoId = @PhaoId,
    @Nam = 2024,
    @NgayBatDau = '2024-01-10',
    @LoaiTrangThai = 'TREN_BAI',
    @MoTaTrangThai = N'Trên bãi Quy Nhơn - Chờ lắp đặt',
    @DiaDiem = N'Bãi Quy Nhơn',
    @NguoiTao = 'NV_KhoPhao'
```

### Use Case 2: Lắp đặt phao lên luồng

```sql
-- Lắp phao D24.025.20 lên vị trí "5"-QN
DECLARE @PhaoId INT = (SELECT Id FROM Phao WHERE MaPhaoDayDu = 'D24.025.20')
DECLARE @ViTriId INT = (SELECT Id FROM DmViTriPhaoBH WHERE MaPhaoBH = '"5"-QN')

EXEC sp_ChuyenPhaoSangViTri
    @PhaoId = @PhaoId,
    @ViTriPhaoBHMoi = @ViTriId,
    @NgayChuyenDoi = '2024-02-01',
    @MoTaTrangThai = N'Lắp đặt phao lên vị trí "5"-QN',
    @NguoiTao = 'KyThuatVien_A'

-- Kết quả:
-- 1. Đóng lịch sử "TREN_BAI" (NgayKetThuc = 2024-02-01)
-- 2. Tạo lịch sử mới "TREN_LUONG" tại "5"-QN
-- 3. Cập nhật Phao.TrangThaiHienTai = '5-QN'
```

### Use Case 3: Thu hồi phao về bảo trì

```sql
-- Thu hồi phao D24.020.16 từ "4A"-QN về bãi
DECLARE @PhaoId INT = (SELECT Id FROM Phao WHERE MaPhaoDayDu = 'D24.020.16')

-- Bước 1: Đóng lịch sử trên luồng
EXEC sp_ThemLichSuHoatDong
    @PhaoId = @PhaoId,
    @Nam = 2024,
    @NgayBatDau = '2024-03-15',
    @LoaiTrangThai = 'THU_HOI',
    @MoTaTrangThai = N'Thu hồi về bảo trì đèn',
    @DiaDiem = N'Trạm QLBH Quy Nhơn',
    @NguoiTao = 'GiamSat_B'

-- Bước 2: Ghi nhận bảo trì
INSERT INTO LichSuBaoTri (
    PhaoId, LoaiCongViec, NgayBatDau, ChiPhiUocTinh,
    NoiDungCongViec, NhanVienThucHien, TrangThai
)
VALUES (
    @PhaoId,
    N'Thay đèn LED',
    '2024-03-16',
    15000000,  -- 15 triệu
    N'Thay đèn LED mới, kiểm tra nguồn điện, sơn lại phao',
    N'Đội bảo trì số 1',
    N'Đang thực hiện'
)
```

### Use Case 4: Xem báo cáo lịch sử theo loại phao

```sql
-- Xem tất cả phao D24 từ 2020-2024
EXEC sp_BaoCao_LichSuTheoLoaiPhao @MaLoaiPhao = 'D24'

-- Kết quả:
/*
MaLoaiPhao | MaPhaoDayDu | STT | Nam  | MoTaTrangThai | MaPhaoBH  | MaTuyenLuong
-----------+-------------+-----+------+---------------+-----------+-------------
D24        | D24.006.04  | 1   | 2020 | 0-QN          | "0"-QN    | QN
D24        | D24.006.04  | 1   | 2021 | 0-QN          | "0"-QN    | QN
D24        | D24.020.16  | 2   | 2020 | 4A-QN         | "4A"-QN   | QN
D24        | D24.020.16  | 2   | 2021 | Thu hồi       | NULL      | NULL
D24        | D24.020.16  | 2   | 2022 | P1-PQ         | P1-PQ     | PQ
*/
```

---

## 9. TÍCH HỢP VỚI MODULE KHO

### 9.1 Liên kết vật tư phao

Module Phao và Module Kho được tích hợp qua bảng `PhieuNhapXuat`:

```sql
-- Xuất vật tư cho bảo trì phao D24.020.16
EXEC sp_XuatKho
    @PhienLamViecId = 100,
    @TaiKhoanId = 5,
    @KhoXuatId = 1,      -- Kho Mẹ
    @NgayPhieu = '2024-03-16',
    @PhaoId = 1,         -- FK đến Phao (D24.020.16)
    @LyDo = N'Xuất vật tư bảo trì phao D24.020.16',
    @DanhSachVatLieu = N'[
        {"VatLieuId": 10, "SoLuong": 1},   -- Đèn LED
        {"VatLieuId": 5, "SoLuong": 50},   -- Sơn chống rỉ (kg)
        {"VatLieuId": 8, "SoLuong": 2}     -- Pin lithium
    ]'
```

**Truy vấn vật tư đã xuất cho phao:**

```sql
SELECT
    p.MaPhaoDayDu,
    pnx.MaPhieu,
    pnx.NgayPhieu,
    vl.TenVatLieu,
    ct.SoLuong,
    dv.TenDonVi
FROM PhieuNhapXuat pnx
INNER JOIN ChiTietPhieuNhapXuat ct ON pnx.Id = ct.PhieuNhapXuatId
INNER JOIN VatLieu vl ON ct.VatLieuId = vl.Id
INNER JOIN DonViTinh dv ON vl.DonViTinhId = dv.Id
INNER JOIN Phao p ON pnx.PhaoId = p.Id
WHERE p.MaPhaoDayDu = 'D24.020.16'
ORDER BY pnx.NgayPhieu DESC
```

### 9.2 Theo dõi chi phí bảo trì

```sql
-- Báo cáo chi phí bảo trì phao D24.020.16
SELECT
    bt.LoaiCongViec,
    bt.NgayBatDau,
    bt.ChiPhiUocTinh,
    bt.ChiPhiThucTe,
    -- Chi phí vật tư
    (SELECT SUM(ct.SoLuong * ct.DonGia)
     FROM PhieuNhapXuat pnx
     INNER JOIN ChiTietPhieuNhapXuat ct ON pnx.Id = ct.PhieuNhapXuatId
     WHERE pnx.PhaoId = p.Id
       AND pnx.NgayPhieu BETWEEN bt.NgayBatDau AND ISNULL(bt.NgayHoanThanh, GETDATE())
    ) AS ChiPhiVatTu
FROM LichSuBaoTri bt
INNER JOIN Phao p ON bt.PhaoId = p.Id
WHERE p.MaPhaoDayDu = 'D24.020.16'
ORDER BY bt.NgayBatDau DESC
```

---

## 10. PERFORMANCE & OPTIMIZATION

### 10.1 Indexes (11 indexes)

| Index                       | Bảng               | Cột                     | Mục đích                          |
| --------------------------- | ------------------ | ----------------------- | --------------------------------- |
| `IX_Phao_MaLoaiPhao`        | Phao               | MaLoaiPhao              | Filter by buoy type (D24, T26...) |
| `IX_Phao_MaPhaoDayDu`       | Phao               | MaPhaoDayDu             | Unique lookup                     |
| `IX_Phao_TrangThai`         | Phao               | TrangThaiHienTai        | Filter active buoys               |
| `IX_LichSu_PhaoId`          | LichSuHoatDongPhao | PhaoId                  | Lookup by buoy                    |
| `IX_LichSu_Nam`             | LichSuHoatDongPhao | Nam                     | Year-based queries                |
| `IX_LichSu_LoaiTrangThai`   | LichSuHoatDongPhao | LoaiTrangThai           | Filter by status                  |
| `IX_LichSu_MaTuyenLuong`    | LichSuHoatDongPhao | MaTuyenLuong            | Filter by route                   |
| `IX_LichSu_MaPhaoBH`        | LichSuHoatDongPhao | MaPhaoBH                | Filter by position                |
| `IX_LichSu_ThoiGian`        | LichSuHoatDongPhao | NgayBatDau, NgayKetThuc | Date range queries                |
| `IX_ViTriPhaoBH_MaPhaoBH`   | DmViTriPhaoBH      | MaPhaoBH                | Unique lookup                     |
| `IX_ViTriPhaoBH_TuyenLuong` | DmViTriPhaoBH      | TuyenLuongId            | Route-based lookup                |

### 10.2 Query Optimization

#### **✓ Sử dụng Computed Column**

```sql
-- ✓ Tốt: Index trên computed column
SELECT * FROM Phao
WHERE MaLoaiPhao = 'D24'  -- Indexed!

-- ❌ Tránh: Tính toán runtime
SELECT * FROM Phao
WHERE LEFT(MaPhaoDayDu, CHARINDEX('.', MaPhaoDayDu) - 1) = 'D24'
```

#### **✓ Sử dụng Views**

```sql
-- ✓ Tốt: View đã optimize
SELECT * FROM vw_BaoCao_LichSuTheoLoaiPhao
WHERE MaLoaiPhao = 'D24' AND Nam = 2024

-- ❌ Tránh: JOIN phức tạp
SELECT ...
FROM LichSuHoatDongPhao ls
INNER JOIN Phao p ...
WHERE ...
```

### 10.3 Partition by Year (Future Enhancement)

Với dataset lớn (>1 triệu records), có thể partition `LichSuHoatDongPhao` theo năm:

```sql
-- Future: Partition by Nam
CREATE PARTITION FUNCTION pf_Year (INT)
AS RANGE RIGHT FOR VALUES (2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024)

CREATE PARTITION SCHEME ps_Year
AS PARTITION pf_Year
ALL TO ([PRIMARY])

-- Recreate table with partition
CREATE TABLE LichSuHoatDongPhao (
    ...
) ON ps_Year(Nam)
```

---

## 11. MIGRATION & DEPLOYMENT

### 11.1 Deployment Order

```
1. VMS_OPTIMIZED.sql (Core tables)
   ├── DmTuyenLuong
   ├── DmViTriPhaoBH
   ├── DmTramQuanLy
   ├── DmDonViVanHanh
   ├── Phao
   ├── LichSuHoatDongPhao
   ├── LichSuBaoTri
   └── LichSuThayDoiThietBi

2. Sample Data
   ├── Tuyến luồng (7 routes)
   ├── Vị trí Phao BH (27 positions)
   └── Trạm quản lý (3 stations)

3. Indexes (11 indexes)

4. Views (2 views)
   ├── vw_BaoCao_LichSuTheoLoaiPhao
   └── vw_BaoCao_LichSuTheoLuong

5. Stored Procedures (4 SPs)
   ├── sp_BaoCao_LichSuTheoLoaiPhao
   ├── sp_BaoCao_LichSuTheoLuong
   ├── sp_ThemLichSuHoatDong
   └── sp_ChuyenPhaoSangViTri

6. Functions (2 functions)
   ├── fn_LayTrangThaiPhaoTheoNam
   └── fn_LayPhaoDangOViTriTheoNgay
```

### 11.2 Data Migration from Legacy

```sql
-- Script di chuyển dữ liệu từ hệ thống cũ
INSERT INTO Phao (KyHieuTaiSan, MaPhaoDayDu, SoPhaoHienTai, ...)
SELECT
    KyHieuTS AS KyHieuTaiSan,
    MaPhao AS MaPhaoDayDu,
    STT AS SoPhaoHienTai,
    ...
FROM LegacySystem.dbo.DanhSachPhao

-- Import lịch sử
INSERT INTO LichSuHoatDongPhao (PhaoId, Nam, NgayBatDau, ...)
SELECT
    p.Id AS PhaoId,
    YEAR(ls.NgayGhiNhan) AS Nam,
    ls.NgayGhiNhan AS NgayBatDau,
    ...
FROM LegacySystem.dbo.LichSuPhao ls
INNER JOIN Phao p ON ls.MaPhao = p.MaPhaoDayDu
```

---

## 12. TROUBLESHOOTING

### Vấn đề 1: "Không tìm thấy loại phao"

```sql
-- Nguyên nhân: Computed column chưa có index
-- Giải pháp: Rebuild index
ALTER INDEX IX_Phao_MaLoaiPhao ON Phao REBUILD
```

### Vấn đề 2: "Lịch sử bị duplicate"

```sql
-- Chẩn đoán
SELECT PhaoId, Nam, COUNT(*)
FROM LichSuHoatDongPhao
WHERE NgayKetThuc IS NULL  -- Đang hoạt động
GROUP BY PhaoId, Nam
HAVING COUNT(*) > 1

-- Giải pháp: Đóng lịch sử cũ trước khi thêm mới
UPDATE LichSuHoatDongPhao
SET NgayKetThuc = @NgayMoi
WHERE PhaoId = @PhaoId AND NgayKetThuc IS NULL
```

### Vấn đề 3: "Báo cáo pivot chậm"

```sql
-- Tối ưu: Lọc theo năm
SELECT * FROM vw_BaoCao_LichSuTheoLoaiPhao
WHERE MaLoaiPhao = 'D24'
  AND Nam BETWEEN 2020 AND 2024  -- Indexed range scan
```

---

## 13. ROADMAP & FUTURE ENHANCEMENTS

### Phase 2

- [ ] **GIS Integration**: Hiển thị phao trên bản đồ (Leaflet/OpenLayers)
- [ ] **AIS Tracking**: Tích hợp dữ liệu AIS real-time
- [ ] **Mobile App**: Ứng dụng di động kiểm tra phao
- [ ] **Alert System**: Cảnh báo phao trôi, đèn tắt
- [ ] **Predictive Maintenance**: ML dự đoán thời điểm bảo trì
- [ ] **QR Code**: Scan QR trên phao để xem thông tin
- [ ] **Photo Gallery**: Thư viện ảnh phao qua các năm
- [ ] **Document Management**: Quản lý hồ sơ, giấy tờ phao

---

## APPENDIX A: SAMPLE QUERIES

### Query 1: Phao đang hoạt động trên luồng

```sql
SELECT
    p.MaPhaoDayDu,
    p.MaLoaiPhao,
    vt.MaPhaoBH AS ViTriHienTai,
    tl.TenTuyen AS TuyenLuong,
    ls.NgayBatDau AS NgayLapDat
FROM Phao p
INNER JOIN LichSuHoatDongPhao ls ON p.Id = ls.PhaoId
INNER JOIN DmViTriPhaoBH vt ON ls.ViTriPhaoBHId = vt.Id
INNER JOIN DmTuyenLuong tl ON vt.TuyenLuongId = tl.Id
WHERE ls.LoaiTrangThai = 'TREN_LUONG'
  AND ls.NgayKetThuc IS NULL
ORDER BY tl.TenTuyen, vt.ThuTuHienThi
```

### Query 2: Phao cần bảo trì xích/rùa

```sql
SELECT
    p.MaPhaoDayDu,
    p.XichPhao_ThoiDiemSuDung,
    DATEDIFF(MONTH, p.XichPhao_ThoiDiemSuDung, GETDATE()) AS ThangDaSuDung,
    p.Rua_ThoiDiemSuDung,
    DATEDIFF(MONTH, p.Rua_ThoiDiemSuDung, GETDATE()) AS ThangDaSuDungRua
FROM Phao p
WHERE p.TrangThaiHienTai LIKE '%TREN_LUONG%'
  AND (
    DATEDIFF(MONTH, p.XichPhao_ThoiDiemSuDung, GETDATE()) >= 36  -- Xích > 3 năm
    OR DATEDIFF(MONTH, p.Rua_ThoiDiemSuDung, GETDATE()) >= 60    -- Rùa > 5 năm
  )
ORDER BY ThangDaSuDung DESC
```

### Query 3: Thống kê chi phí bảo trì theo năm

```sql
SELECT
    YEAR(bt.NgayBatDau) AS Nam,
    p.MaLoaiPhao,
    COUNT(*) AS SoLanBaoTri,
    SUM(bt.ChiPhiThucTe) AS TongChiPhi,
    AVG(bt.ChiPhiThucTe) AS ChiPhiTrungBinh
FROM LichSuBaoTri bt
INNER JOIN Phao p ON bt.PhaoId = p.Id
WHERE bt.ChiPhiThucTe IS NOT NULL
GROUP BY YEAR(bt.NgayBatDau), p.MaLoaiPhao
ORDER BY Nam DESC, TongChiPhi DESC
```

---

**END OF DOCUMENTATION**

_Generated by Senior BigTech Architect_  
_Maritime Buoy Lifecycle Management System_
