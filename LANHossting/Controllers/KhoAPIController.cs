using Microsoft.AspNetCore.Mvc;
using LANHossting.Data;
using LANHossting.Models;
using LANHossting.Filters;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using System.Drawing;

namespace LANHossting.Controllers
{
    [AuthorizeRole("ADMIN", "NHAN_VIEN_KHO")]
    [Route("api/kho")]
    [ApiController]
    public class KhoAPIController : ControllerBase
    {
        private readonly AppDbContext _context;

        public KhoAPIController(AppDbContext context)
        {
            _context = context;
            // Set EPPlus License Context
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
        }

        // GET: api/kho/vatlieu - Lấy danh sách vật liệu
        [HttpGet("vatlieu")]
        public async Task<IActionResult> GetVatLieu()
        {
            try
            {
                var vatLieu = await _context.VatLieu
                    .Include(v => v.NhomVatLieu)
                    .Include(v => v.DonViTinh)
                    .Where(v => v.TrangThai == "Hoạt động" || v.TrangThai == "Đang sử dụng")
                    .OrderBy(v => v.MaVatLieu)
                    .Select(v => new
                    {
                        v.Id,
                        v.MaVatLieu,
                        v.TenVatLieu,
                        NhomVatLieuId = v.NhomVatLieuId ?? 0,
                        NhomVatLieu = v.NhomVatLieu != null ? v.NhomVatLieu.TenNhom : "N/A",
                        DonViTinhId = v.DonViTinhId,
                        DonViTinh = v.DonViTinh != null ? v.DonViTinh.TenDonVi : "N/A",
                        v.TrangThai
                    })
                    .ToListAsync();

                return Ok(vatLieu);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi: " + ex.Message });
            }
        }

        // GET: api/kho/tonkho?khoId=1 - Lấy tồn kho theo kho
        [HttpGet("tonkho")]
        public async Task<IActionResult> GetTonKho([FromQuery] int khoId)
        {
            try
            {
                Console.WriteLine($"[API] GetTonKho called with khoId: {khoId}");
                
                // Lấy tồn kho
                var tonKho = await _context.TonKho
                    .Where(t => t.KhoId == khoId)
                    .ToListAsync();
                
                Console.WriteLine($"[API] Found {tonKho.Count} TonKho records");
                
                // Lấy thông tin VatLieu
                var vatLieuIds = tonKho.Select(t => t.VatLieuId).Distinct().ToList();
                var vatLieuList = await _context.VatLieu
                    .Where(v => vatLieuIds.Contains(v.Id))
                    .ToListAsync();
                
                // Lấy NhomVatLieu và DonViTinh
                var nhomIds = vatLieuList.Where(v => v.NhomVatLieuId.HasValue).Select(v => v.NhomVatLieuId!.Value).Distinct().ToList();
                var donViIds = vatLieuList.Select(v => v.DonViTinhId).Distinct().ToList();
                
                var nhomList = await _context.NhomVatLieu.Where(n => nhomIds.Contains(n.Id)).ToDictionaryAsync(n => n.Id, n => n.TenNhom);
                var donViList = await _context.DonViTinh.Where(d => donViIds.Contains(d.Id)).ToDictionaryAsync(d => d.Id, d => d.TenDonVi);
                
                // Lấy đơn giá từ ChiTietPhieuNhapXuat (phiếu nhập gần nhất)
                var donGiaDict = await _context.ChiTietPhieuNhapXuat
                    .Where(ct => ct.PhieuNhapXuat != null && 
                                 ct.PhieuNhapXuat.LoaiPhieu == "NHAP_KHO" && 
                                 ct.PhieuNhapXuat.KhoNhapId == khoId &&
                                 ct.DonGia != null && ct.DonGia > 0)
                    .GroupBy(ct => ct.VatLieuId)
                    .Select(g => new { 
                        VatLieuId = g.Key, 
                        DonGia = g.OrderByDescending(ct => ct.PhieuNhapXuat!.NgayPhieu).FirstOrDefault()!.DonGia 
                    })
                    .ToDictionaryAsync(x => x.VatLieuId, x => x.DonGia ?? 0);
                
                var result = tonKho.Select(t => {
                    var vl = vatLieuList.FirstOrDefault(v => v.Id == t.VatLieuId);
                    var donGia = donGiaDict.ContainsKey(t.VatLieuId) ? donGiaDict[t.VatLieuId] : 0;
                    var giaTri = t.SoLuongTon * donGia;
                    return new {
                        t.Id,
                        VatLieuId = t.VatLieuId,
                        MaVatLieu = vl?.MaVatLieu ?? "",
                        TenVatLieu = vl?.TenVatLieu ?? "",
                        NhomVatLieuId = vl?.NhomVatLieuId ?? 0,
                        NhomVatLieu = vl?.NhomVatLieuId != null && nhomList.ContainsKey(vl.NhomVatLieuId.Value) ? nhomList[vl.NhomVatLieuId.Value] : "N/A",
                        DonViTinhId = vl?.DonViTinhId ?? 0,
                        DonViTinh = vl != null && donViList.ContainsKey(vl.DonViTinhId) ? donViList[vl.DonViTinhId] : "N/A",
                        t.SoLuongTon,
                        DonGia = donGia,
                        GiaTri = giaTri
                    };
                }).ToList();

                Console.WriteLine($"[API] Returning {result.Count} items for khoId: {khoId}");
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[API] Error in GetTonKho: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new { message = "Lỗi: " + ex.Message });
            }
        }

        // GET: api/kho/danhsachkho - Lấy danh sách kho
        [HttpGet("danhsachkho")]
        public async Task<IActionResult> GetDanhSachKho()
        {
            try
            {
                var kho = await _context.Kho
                    .Where(k => k.TrangThai == "Hoạt động" || k.TrangThai == "Đang sử dụng")
                    .OrderBy(k => k.LoaiKho)
                    .ThenBy(k => k.MaKho)
                    .Select(k => new
                    {
                        k.Id,
                        k.MaKho,
                        k.TenKho,
                        k.LoaiKho,
                        k.DiaChi,
                        k.KhoMeId
                    })
                    .ToListAsync();

                return Ok(kho);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi: " + ex.Message });
            }
        }

        // GET: api/kho/nhomvatlieu - Lấy danh sách nhóm vật liệu
        [HttpGet("nhomvatlieu")]
        public async Task<IActionResult> GetNhomVatLieu()
        {
            try
            {
                var nhom = await _context.NhomVatLieu
                    .OrderBy(n => n.Id)
                    .Select(n => new
                    {
                        n.Id,
                        n.MaNhom,
                        n.TenNhom,
                        n.MoTa
                    })
                    .ToListAsync();

                return Ok(nhom);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi: " + ex.Message });
            }
        }

        // GET: api/kho/donvitinh - Lấy danh sách đơn vị tính
        [HttpGet("donvitinh")]
        public async Task<IActionResult> GetDonViTinh()
        {
            try
            {
                var donVi = await _context.DonViTinh
                    .OrderBy(d => d.Id)
                    .Select(d => new
                    {
                        d.Id,
                        d.MaDonVi,
                        d.TenDonVi
                    })
                    .ToListAsync();

                return Ok(donVi);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi: " + ex.Message });
            }
        }

        // POST: api/kho/themvatlieu - Thêm vật liệu mới
        [HttpPost("themvatlieu")]
        public async Task<IActionResult> ThemVatLieu([FromBody] VatLieuRequest request)
        {
            try
            {
                // Kiểm tra mã trùng
                if (await _context.VatLieu.AnyAsync(v => v.MaVatLieu == request.MaVatLieu))
                {
                    return BadRequest(new { message = "Mã vật liệu đã tồn tại!" });
                }

                var vatLieu = new VatLieu
                {
                    MaVatLieu = request.MaVatLieu,
                    TenVatLieu = request.TenVatLieu,
                    NhomVatLieuId = request.NhomVatLieuId,
                    DonViTinhId = request.DonViTinhId,
                    TrangThai = "Đang sử dụng",
                    NgayTao = DateTime.Now
                };

                _context.VatLieu.Add(vatLieu);
                await _context.SaveChangesAsync();

                // Tạo tồn kho ban đầu = 0 cho tất cả các kho
                var danhSachKho = await _context.Kho.Where(k => k.TrangThai == "Hoạt động" || k.TrangThai == "Đang sử dụng").ToListAsync();
                foreach (var kho in danhSachKho)
                {
                    _context.TonKho.Add(new TonKho
                    {
                        KhoId = kho.Id,
                        VatLieuId = vatLieu.Id,
                        SoLuongTon = 0,
                        SoLuongDatCho = 0,
                        NgayCapNhat = DateTime.Now
                    });
                }
                await _context.SaveChangesAsync();

                return Ok(new { message = "Thêm vật liệu thành công!", vatLieu });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi: " + ex.Message });
            }
        }

        // POST: api/kho/giaodich - Lưu giao dịch nhập/xuất/chuyển
        [HttpPost("giaodich")]
        public async Task<IActionResult> LuuGiaoDich([FromBody] GiaoDichRequest request)
        {
            try
            {
                var userId = HttpContext.Session.GetString("UserId");
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "Chưa đăng nhập!" });
                }

                foreach (var item in request.Items)
                {
                    // Lấy PhienLamViec hiện tại
                    var phienLamViec = await _context.PhienLamViec
                        .Where(p => p.TaiKhoanId == int.Parse(userId) && p.TrangThai == "Đang hoạt động")
                        .FirstOrDefaultAsync();
                    
                    int phienLamViecId = phienLamViec?.Id ?? 1;

                    // Tạo phiếu nhập/xuất
                    var phieu = new PhieuNhapXuat
                    {
                        MaPhieu = GenerateSoPhieu(item.LoaiPhieu),
                        LoaiPhieu = item.LoaiPhieu == "NHAP" ? "NHAP_KHO" : 
                                   (item.LoaiPhieu == "XUAT" ? "XUAT_KHO" : "CHUYEN_KHO"),
                        PhienLamViecId = phienLamViecId,
                        TaiKhoanId = int.Parse(userId),
                        NgayPhieu = DateTime.Now,
                        NgayThucHien = DateTime.Now,
                        KhoNguonId = item.LoaiPhieu == "NHAP" ? null : request.KhoId,
                        KhoNhapId = item.LoaiPhieu == "XUAT" ? null : 
                                   (item.LoaiPhieu == "DIEUCHUYEN" ? item.KhoNhanId : request.KhoId),
                        DonViCungCap = item.NhaCungCap, // Nhà cung cấp
                        LyDo = request.GhiChu,
                        TrangThai = "Hoàn thành",
                        NguoiDuyet = int.Parse(userId),
                        NgayDuyet = DateTime.Now,
                        GhiChu = item.GhiChu ?? request.GhiChu
                    };

                    _context.PhieuNhapXuat.Add(phieu);
                    await _context.SaveChangesAsync();

                    // Tạo chi tiết phiếu với đầy đủ thông tin
                    var chiTiet = new ChiTietPhieuNhapXuat
                    {
                        PhieuNhapXuatId = phieu.Id,
                        VatLieuId = item.VatLieuId,
                        SoLuong = item.SoLuong,
                        DonGia = item.DonGia ?? 0,
                        SoLo = item.SoLo,
                        NgaySanXuat = item.NgaySanXuat,
                        NgayHetHan = item.NgayHetHan,
                        ViTri = item.ViTri,
                        TinhTrangVatLieu = item.TinhTrangVatLieu ?? "Tốt",
                        GhiChu = item.GhiChu ?? request.GhiChu
                    };
                    _context.ChiTietPhieuNhapXuat.Add(chiTiet);

                    // Cập nhật tồn kho
                    if (item.LoaiPhieu == "NHAP")
                    {
                        await CapNhatTonKho(request.KhoId, item.VatLieuId, item.SoLuong, true);
                    }
                    else if (item.LoaiPhieu == "XUAT")
                    {
                        await CapNhatTonKho(request.KhoId, item.VatLieuId, item.SoLuong, false);
                    }
                    else if (item.LoaiPhieu == "DIEUCHUYEN")
                    {
                        await CapNhatTonKho(request.KhoId, item.VatLieuId, item.SoLuong, false);
                        await CapNhatTonKho(item.KhoNhanId!.Value, item.VatLieuId, item.SoLuong, true);
                    }

                    // Tạo lịch sử vật liệu
                    _context.LichSuVatLieu.Add(new LichSuVatLieu
                    {
                        VatLieuId = item.VatLieuId,
                        PhieuNhapXuatId = phieu.Id,
                        ThoiGian = DateTime.Now,
                        HanhDong = item.LoaiPhieu,
                        SoLuong = item.SoLuong,
                        DonGia = item.DonGia,
                        KhoId = request.KhoId,
                        NguoiThucHienId = int.Parse(userId),
                        GhiChu = request.GhiChu
                    });
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Lưu giao dịch thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi: " + ex.Message });
            }
        }

        // GET: api/kho/lichsu?khoId=1 - Lấy lịch sử giao dịch
        [HttpGet("lichsu")]
        public async Task<IActionResult> GetLichSu([FromQuery] int khoId)
        {
            try
            {
                var lichSu = await _context.ChiTietPhieuNhapXuat
                    .Include(ct => ct.PhieuNhapXuat)
                    .Include(ct => ct.VatLieu)
                    .Where(ct => ct.PhieuNhapXuat != null && 
                                (ct.PhieuNhapXuat.KhoNguonId == khoId || ct.PhieuNhapXuat.KhoNhapId == khoId))
                    .OrderByDescending(ct => ct.PhieuNhapXuat!.NgayPhieu)
                    .Take(100)
                    .Select(ct => new
                    {
                        ct.Id,
                        MaPhieu = ct.PhieuNhapXuat != null ? ct.PhieuNhapXuat.MaPhieu : "",
                        LoaiPhieu = ct.PhieuNhapXuat != null ? ct.PhieuNhapXuat.LoaiPhieu : "",
                        NgayPhieu = ct.PhieuNhapXuat != null ? ct.PhieuNhapXuat.NgayPhieu.ToString("dd/MM/yyyy HH:mm:ss") : "",
                        VatLieu = new
                        {
                            MaVatLieu = ct.VatLieu != null ? ct.VatLieu.MaVatLieu : "",
                            TenVatLieu = ct.VatLieu != null ? ct.VatLieu.TenVatLieu : ""
                        },
                        ct.SoLuong,
                        ct.DonGia,
                        ThanhTien = ct.SoLuong * (ct.DonGia ?? 0),
                        TrangThai = ct.PhieuNhapXuat != null ? ct.PhieuNhapXuat.TrangThai : "",
                        ct.GhiChu
                    })
                    .ToListAsync();

                return Ok(lichSu);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi: " + ex.Message });
            }
        }

        // GET: api/kho/export?khoId=1 - Xuất báo cáo Excel
        [HttpGet("export")]
        public async Task<IActionResult> ExportExcel([FromQuery] int khoId)
        {
            try
            {
                var kho = await _context.Kho.FindAsync(khoId);
                if (kho == null)
                {
                    return NotFound(new { message = "Không tìm thấy kho!" });
                }

                var tonKho = await _context.TonKho
                    .Include(t => t.VatLieu)
                        .ThenInclude(v => v.NhomVatLieu)
                    .Include(t => t.VatLieu)
                        .ThenInclude(v => v.DonViTinh)
                    .Where(t => t.KhoId == khoId)
                    .OrderBy(t => t.VatLieu.MaVatLieu)
                    .ToListAsync();

                using (var package = new ExcelPackage())
                {
                    var worksheet = package.Workbook.Worksheets.Add("Tồn Kho");
                    worksheet.CreateExcel(tonKho, kho.TenKho);

                    var stream = new MemoryStream(package.GetAsByteArray());
                    string fileName = $"BienBanKiemKe_{kho.MaKho}_{DateTime.Now:yyyy-MM-dd}.xlsx";

                    return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi: " + ex.Message });
            }
        }

        // Helper Methods
        private async Task CapNhatTonKho(int khoId, int vatLieuId, decimal soLuong, bool laNhap)
        {
            var tonKho = await _context.TonKho
                .FirstOrDefaultAsync(t => t.KhoId == khoId && t.VatLieuId == vatLieuId);

            if (tonKho == null)
            {
                // Tạo mới nếu chưa có
                tonKho = new TonKho
                {
                    KhoId = khoId,
                    VatLieuId = vatLieuId,
                    SoLuongTon = 0,
                    SoLuongDatCho = 0,
                    NgayCapNhat = DateTime.Now
                };
                _context.TonKho.Add(tonKho);
            }

            if (laNhap)
            {
                tonKho.SoLuongTon += soLuong;
            }
            else
            {
                tonKho.SoLuongTon -= soLuong;
            }

            tonKho.NgayCapNhat = DateTime.Now;
        }

        private string GenerateSoPhieu(string loaiPhieu)
        {
            string prefix = loaiPhieu switch
            {
                "NHAP" => "PN",
                "XUAT" => "PX",
                "DIEUCHUYEN" => "PC",
                _ => "P"
            };

            return $"{prefix}{DateTime.Now:yyyyMMddHHmmss}";
        }
    }

    // DTOs
    public class VatLieuRequest
    {
        public string MaVatLieu { get; set; } = string.Empty;
        public string TenVatLieu { get; set; } = string.Empty;
        public int? NhomVatLieuId { get; set; }
        public int DonViTinhId { get; set; }
    }

    public class GiaoDichRequest
    {
        public int KhoId { get; set; }
        public string? GhiChu { get; set; }
        public List<GiaoDichItem> Items { get; set; } = new List<GiaoDichItem>();
    }

    public class GiaoDichItem
    {
        public int VatLieuId { get; set; }
        public string LoaiPhieu { get; set; } = string.Empty;
        public decimal SoLuong { get; set; }
        public decimal? DonGia { get; set; }
        public int? KhoNhanId { get; set; }
        
        // Thông tin bổ sung cho nhập kho
        public string? SoLo { get; set; }
        public DateTime? NgaySanXuat { get; set; }
        public DateTime? NgayHetHan { get; set; }
        public string? ViTri { get; set; }
        public string? TinhTrangVatLieu { get; set; }
        public string? NhaCungCap { get; set; }
        public string? GhiChu { get; set; }
    }

    // Extension Methods for Excel
    public static class ExcelExtensions
    {
        public static ExcelWorksheet CreateExcel(this ExcelWorksheet ws, List<TonKho> data, string tenKho)
        {
            // Title
            ws.Cells["A1:H1"].Merge = true;
            ws.Cells["A1"].Value = "BIÊN BẢN KIỂM KÊ VẬT TƯ";
            ws.Cells["A1"].Style.Font.Size = 20;
            ws.Cells["A1"].Style.Font.Bold = true;
            ws.Cells["A1"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

            // Subtitle
            ws.Cells["A2:H2"].Merge = true;
            ws.Cells["A2"].Value = $"Kho: {tenKho} - Ngày kiểm kê: {DateTime.Now:dd/MM/yyyy HH:mm:ss}";
            ws.Cells["A2"].Style.Font.Bold = true;
            ws.Cells["A2"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

            // Headers
            int headerRow = 4;
            string[] headers = { "STT", "Mã Vật Tư", "Tên Vật Tư", "Nhóm Vật Liệu", "ĐVT", "Tồn Kho", "Ghi Chú", "Trạng Thái" };
            
            for (int i = 0; i < headers.Length; i++)
            {
                ws.Cells[headerRow, i + 1].Value = headers[i];
                ws.Cells[headerRow, i + 1].Style.Font.Bold = true;
                ws.Cells[headerRow, i + 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
                ws.Cells[headerRow, i + 1].Style.Fill.BackgroundColor.SetColor(Color.LightGray);
                ws.Cells[headerRow, i + 1].Style.Border.BorderAround(ExcelBorderStyle.Thin);
                ws.Cells[headerRow, i + 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            }

            // Data
            int startRow = headerRow + 1;
            for (int i = 0; i < data.Count; i++)
            {
                int row = startRow + i;
                var item = data[i];

                ws.Cells[row, 1].Value = i + 1;
                ws.Cells[row, 2].Value = item.VatLieu?.MaVatLieu;
                ws.Cells[row, 3].Value = item.VatLieu?.TenVatLieu;
                ws.Cells[row, 4].Value = item.VatLieu?.NhomVatLieu?.TenNhom ?? "N/A";
                ws.Cells[row, 5].Value = item.VatLieu?.DonViTinh?.TenDonVi ?? "N/A";
                ws.Cells[row, 6].Value = (double)item.SoLuongTon;
                ws.Cells[row, 6].Style.Numberformat.Format = "#,##0.00";
                ws.Cells[row, 7].Value = ""; // Ghi chú
                ws.Cells[row, 8].Value = item.VatLieu?.TrangThai ?? "N/A";

                // Borders
                for (int col = 1; col <= 8; col++)
                {
                    ws.Cells[row, col].Style.Border.BorderAround(ExcelBorderStyle.Thin);
                }
            }

            // Total row
            int totalRow = startRow + data.Count;
            ws.Cells[totalRow, 1].Value = "TỔNG CỘNG";
            ws.Cells[totalRow, 1, totalRow, 5].Merge = true;
            ws.Cells[totalRow, 1].Style.Font.Bold = true;
            ws.Cells[totalRow, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            ws.Cells[totalRow, 6].Value = data.Sum(d => (double)d.SoLuongTon);
            ws.Cells[totalRow, 6].Style.Numberformat.Format = "#,##0.00";
            ws.Cells[totalRow, 6].Style.Font.Bold = true;

            for (int col = 1; col <= 8; col++)
            {
                ws.Cells[totalRow, col].Style.Border.BorderAround(ExcelBorderStyle.Thin);
            }

            // Auto-fit columns
            ws.Cells[ws.Dimension.Address].AutoFitColumns();
            ws.Column(3).Width = 50; // Tên vật tư rộng hơn
            ws.Column(4).Width = 25; // Nhóm vật liệu

            return ws;
        }
    }
}
