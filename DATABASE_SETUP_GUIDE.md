# Hướng Dẫn Liên Kết Database VMS_DB với ASP.NET Core MVC

## ✅ Đã Hoàn Thành

Dự án của bạn đã được cấu hình để kết nối với database **VMS_DB** trên SQL Server.

### 📁 Các File Đã Tạo/Cập Nhật

1. **Data/AppDbContext.cs**

   - DbContext chính cho toàn bộ hệ thống
   - Quản lý tất cả các bảng từ cả 2 module: Buoy và Warehouse
   - Cấu hình các quan hệ Foreign Key

2. **Models/BuoyModels.cs**

   - Model cho module quản lý phao
   - Bao gồm: DmTuyenLuong, DmViTriPhaoBH, Phao

3. **Models/WarehouseModels.cs**

   - Model cho module quản lý kho
   - Bao gồm: VaiTro, TaiKhoan, PhienLamViec, Kho, VatLieu, TonKho, PhieuNhapXuat, LichSuVatLieu

4. **Controllers/TestDbController.cs**

   - Controller để test kết nối database
   - Các action: Index, DanhSachTuyenLuong, DanhSachKho, DanhSachPhao
   - API: GetDatabaseInfo (trả về JSON)

5. **Views/TestDb/**

   - Index.cshtml: Trang test kết nối và thống kê
   - DanhSachTuyenLuong.cshtml: Hiển thị danh sách tuyến luồng
   - DanhSachKho.cshtml: Hiển thị danh sách kho
   - DanhSachPhao.cshtml: Hiển thị danh sách phao

6. **appsettings.json & appsettings.Development.json**

   - Connection string đã được cấu hình
   - Server: TIEUMY\\SQLEXPRESS
   - Database: VMS_DB

7. **Program.cs**
   - Đã đăng ký DbContext với Dependency Injection
   - Sử dụng SQL Server

## 🚀 Cách Chạy và Test

### 1. Build Project

```powershell
cd f:\Soure_Code\AAVMS_Project\LANHossting
dotnet build
```

### 2. Chạy Ứng Dụng

```powershell
dotnet run
```

Hoặc nhấn **F5** trong Visual Studio.

### 3. Test Kết Nối Database

Mở trình duyệt và truy cập:

- **Trang Test Kết Nối:** http://localhost:5000/TestDb
- **Danh Sách Tuyến Luồng:** http://localhost:5000/TestDb/DanhSachTuyenLuong
- **Danh Sách Kho:** http://localhost:5000/TestDb/DanhSachKho
- **Danh Sách Phao:** http://localhost:5000/TestDb/DanhSachPhao
- **API JSON:** http://localhost:5000/TestDb/GetDatabaseInfo

## 📊 Cấu Trúc Database

### Module Buoy (Quản lý Phao)

- `DmTuyenLuong`: Danh mục tuyến luồng
- `DmViTriPhaoBH`: Vị trí phao báo hiệu trên luồng
- `Phao`: Quản lý phao chính

### Module Warehouse (Quản lý Kho)

- `VaiTro`: Vai trò người dùng
- `TaiKhoan`: Tài khoản người dùng
- `PhienLamViec`: Phiên đăng nhập
- `Kho`: Danh sách kho (kho mẹ + kho con)
- `VatLieu`: Danh mục vật liệu
- `TonKho`: Tồn kho theo kho và vật liệu
- `PhieuNhapXuat`: Phiếu nhập/xuất/chuyển kho
- `LichSuVatLieu`: Lịch sử thay đổi vật liệu

## 💡 Sử Dụng DbContext Trong Controller

### Ví dụ 1: Lấy danh sách

```csharp
public class PhaoController : Controller
{
    private readonly AppDbContext _context;

    public PhaoController(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var danhSachPhao = await _context.Phao
            .Where(p => p.TrangThai == "Hoạt động")
            .OrderBy(p => p.MaPhaoDayDu)
            .ToListAsync();

        return View(danhSachPhao);
    }
}
```

### Ví dụ 2: Lấy với Include (Join)

```csharp
public async Task<IActionResult> ChiTietKho(int id)
{
    var kho = await _context.Kho
        .Include(k => k.KhoMe)
        .Include(k => k.TonKhoList)
            .ThenInclude(t => t.VatLieu)
        .FirstOrDefaultAsync(k => k.Id == id);

    return View(kho);
}
```

### Ví dụ 3: Thêm mới

```csharp
[HttpPost]
public async Task<IActionResult> ThemMoi(VatLieu vatLieu)
{
    if (ModelState.IsValid)
    {
        vatLieu.NgayTao = DateTime.Now;
        _context.VatLieu.Add(vatLieu);
        await _context.SaveChangesAsync();
        return RedirectToAction("Index");
    }
    return View(vatLieu);
}
```

### Ví dụ 4: Cập nhật

```csharp
[HttpPost]
public async Task<IActionResult> CapNhat(int id, Phao phao)
{
    if (id != phao.Id)
    {
        return NotFound();
    }

    if (ModelState.IsValid)
    {
        try
        {
            phao.NgayCapNhat = DateTime.Now;
            _context.Update(phao);
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!PhaoExists(phao.Id))
                return NotFound();
            else
                throw;
        }
        return RedirectToAction("Index");
    }
    return View(phao);
}
```

### Ví dụ 5: Xóa

```csharp
[HttpPost]
public async Task<IActionResult> Xoa(int id)
{
    var phao = await _context.Phao.FindAsync(id);
    if (phao != null)
    {
        _context.Phao.Remove(phao);
        await _context.SaveChangesAsync();
    }
    return RedirectToAction("Index");
}
```

## 🔧 Các Lệnh Hữu Ích

### Migration (nếu cần)

```powershell
# Tạo migration mới
dotnet ef migrations add InitialCreate

# Cập nhật database
dotnet ef database update

# Xem SQL được generate
dotnet ef migrations script
```

### Kiểm tra Connection String

```powershell
# Trong appsettings.json
"ConnectionStrings": {
  "DefaultConnection": "Server=TIEUMY\\SQLEXPRESS;Database=VMS_DB;Trusted_Connection=True;TrustServerCertificate=True"
}
```

## ⚠️ Lưu Ý

1. **SQL Server phải đang chạy**: Đảm bảo SQL Server instance `TIEUMY\SQLEXPRESS` đang hoạt động

2. **Database đã tồn tại**: Database VMS_DB phải được tạo trước (từ file .sql trong thư mục db/)

3. **Permissions**: Tài khoản Windows hiện tại phải có quyền truy cập SQL Server (do dùng Trusted_Connection=True)

4. **Entity Framework Core Packages**: Đã được cài đặt sẵn:
   - Microsoft.EntityFrameworkCore.SqlServer (8.0.0)
   - Microsoft.EntityFrameworkCore.Tools (8.0.0)
   - Microsoft.EntityFrameworkCore.Design (8.0.0)

## 🎯 Bước Tiếp Theo

1. ✅ Chạy test để xác nhận kết nối thành công
2. 🔨 Tạo các Controller và View cho từng module
3. 🔐 Implement Authentication/Authorization
4. 📱 Phát triển các chức năng nghiệp vụ
5. 🎨 Tối ưu UI/UX

## 📞 Hỗ Trợ

Nếu gặp lỗi kết nối:

- Kiểm tra SQL Server có đang chạy không
- Kiểm tra tên server và database trong connection string
- Kiểm tra firewall settings
- Xem log chi tiết trong Output window của Visual Studio

---

**Tác giả:** GitHub Copilot  
**Ngày tạo:** 16/01/2026  
**Version:** 1.0
