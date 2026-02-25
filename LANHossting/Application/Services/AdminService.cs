using LANHossting.Application.DTOs;
using LANHossting.Application.Interfaces;

namespace LANHossting.Application.Services
{
    /// <summary>
    /// Service cho Admin module.
    /// Orchestrates: validation → repository → system log.
    /// Controller NEVER has business rules.
    /// </summary>
    public class AdminService : IAdminService
    {
        private readonly IAdminRepository _adminRepo;
        private readonly ISystemLogRepository _logRepo;

        public AdminService(IAdminRepository adminRepo, ISystemLogRepository logRepo)
        {
            _adminRepo = adminRepo;
            _logRepo = logRepo;
        }

        // ══════════════════════════════════════════
        // TÀI KHOẢN
        // ══════════════════════════════════════════

        public async Task<List<TaiKhoanListDto>> GetDanhSachTaiKhoanAsync()
        {
            return await _adminRepo.GetDanhSachTaiKhoanAsync();
        }

        public async Task<ServiceResult> CreateTaiKhoanAsync(CreateTaiKhoanDto dto, int nguoiTaoId, string? ip)
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(dto.TenDangNhap))
                errors.Add("Tên đăng nhập là bắt buộc.");

            if (string.IsNullOrWhiteSpace(dto.MatKhau))
                errors.Add("Mật khẩu là bắt buộc.");
            else if (dto.MatKhau.Length < 6)
                errors.Add("Mật khẩu phải có ít nhất 6 ký tự.");

            if (string.IsNullOrWhiteSpace(dto.HoTen))
                errors.Add("Họ tên là bắt buộc.");

            if (dto.VaiTroId <= 0)
                errors.Add("Vai trò là bắt buộc.");

            if (errors.Count > 0)
                return new ServiceResult { Success = false, Message = "Dữ liệu không hợp lệ.", Errors = errors };

            // Duplicate check
            if (await _adminRepo.TenDangNhapExistsAsync(dto.TenDangNhap.Trim()))
            {
                return new ServiceResult
                {
                    Success = false,
                    Message = "Tên đăng nhập đã tồn tại.",
                    Errors = new List<string> { "Tên đăng nhập đã tồn tại trong hệ thống." }
                };
            }

            var newId = await _adminRepo.CreateTaiKhoanAsync(dto, nguoiTaoId);

            // Log
            await _logRepo.WriteLogAsync(nguoiTaoId, "TAO", "TAI_KHOAN", newId,
                $"Tạo tài khoản '{dto.TenDangNhap.Trim()}' - {dto.HoTen.Trim()}", ip);

            return new ServiceResult { Success = true, Message = "Tạo tài khoản thành công!" };
        }

        public async Task<ServiceResult> UpdateTaiKhoanAsync(UpdateTaiKhoanDto dto, int nguoiThucHienId, string? ip)
        {
            var errors = new List<string>();

            if (dto.Id <= 0)
                errors.Add("ID tài khoản không hợp lệ.");

            if (string.IsNullOrWhiteSpace(dto.HoTen))
                errors.Add("Họ tên là bắt buộc.");

            if (dto.VaiTroId <= 0)
                errors.Add("Vai trò là bắt buộc.");

            if (errors.Count > 0)
                return new ServiceResult { Success = false, Message = "Dữ liệu không hợp lệ.", Errors = errors };

            var result = await _adminRepo.UpdateTaiKhoanAsync(dto);
            if (!result)
                return new ServiceResult { Success = false, Message = "Không tìm thấy tài khoản." };

            await _logRepo.WriteLogAsync(nguoiThucHienId, "SUA", "TAI_KHOAN", dto.Id,
                $"Cập nhật tài khoản ID={dto.Id} - {dto.HoTen.Trim()}", ip);

            return new ServiceResult { Success = true, Message = "Cập nhật tài khoản thành công!" };
        }

        public async Task<ServiceResult> DeleteTaiKhoanAsync(int id, int nguoiThucHienId, string? ip)
        {
            if (id == nguoiThucHienId)
                return new ServiceResult { Success = false, Message = "Không thể xóa chính tài khoản đang đăng nhập." };

            // Lấy thông tin trước khi xóa (cho log)
            var tk = await _adminRepo.GetTaiKhoanByIdAsync(id);
            if (tk == null)
                return new ServiceResult { Success = false, Message = "Không tìm thấy tài khoản." };

            var result = await _adminRepo.DeleteTaiKhoanAsync(id);
            if (!result)
                return new ServiceResult { Success = false, Message = "Xóa tài khoản thất bại." };

            await _logRepo.WriteLogAsync(nguoiThucHienId, "XOA", "TAI_KHOAN", id,
                $"Xóa tài khoản '{tk.TenDangNhap}' - {tk.HoTen}", ip);

            return new ServiceResult { Success = true, Message = "Xóa tài khoản thành công!" };
        }

        public async Task<ServiceResult> ToggleTrangThaiAsync(int id, int nguoiThucHienId, string? ip)
        {
            if (id == nguoiThucHienId)
                return new ServiceResult { Success = false, Message = "Không thể khóa chính tài khoản đang đăng nhập." };

            var tk = await _adminRepo.GetTaiKhoanByIdAsync(id);
            if (tk == null)
                return new ServiceResult { Success = false, Message = "Không tìm thấy tài khoản." };

            var result = await _adminRepo.ToggleTrangThaiAsync(id);
            if (!result)
                return new ServiceResult { Success = false, Message = "Thay đổi trạng thái thất bại." };

            var action = tk.TrangThai == "Hoạt động" ? "KHOA" : "MO_KHOA";
            var desc = tk.TrangThai == "Hoạt động"
                ? $"Khóa tài khoản '{tk.TenDangNhap}'"
                : $"Mở khóa tài khoản '{tk.TenDangNhap}'";

            await _logRepo.WriteLogAsync(nguoiThucHienId, action, "TAI_KHOAN", id, desc, ip);

            return new ServiceResult { Success = true, Message = desc + " thành công!" };
        }

        public async Task<ServiceResult> ResetPasswordAsync(ResetPasswordDto dto, int nguoiThucHienId, string? ip)
        {
            if (string.IsNullOrWhiteSpace(dto.MatKhauMoi))
                return new ServiceResult { Success = false, Message = "Mật khẩu mới là bắt buộc." };

            if (dto.MatKhauMoi.Length < 6)
                return new ServiceResult { Success = false, Message = "Mật khẩu phải có ít nhất 6 ký tự." };

            var tk = await _adminRepo.GetTaiKhoanByIdAsync(dto.TaiKhoanId);
            if (tk == null)
                return new ServiceResult { Success = false, Message = "Không tìm thấy tài khoản." };

            var result = await _adminRepo.ResetPasswordAsync(dto.TaiKhoanId, dto.MatKhauMoi);
            if (!result)
                return new ServiceResult { Success = false, Message = "Reset mật khẩu thất bại." };

            await _logRepo.WriteLogAsync(nguoiThucHienId, "RESET_PASS", "TAI_KHOAN", dto.TaiKhoanId,
                $"Reset mật khẩu tài khoản '{tk.TenDangNhap}'", ip);

            return new ServiceResult { Success = true, Message = "Reset mật khẩu thành công!" };
        }

        // ══════════════════════════════════════════
        // VAI TRÒ
        // ══════════════════════════════════════════

        public async Task<List<VaiTroDropdownDto>> GetDanhSachVaiTroAsync()
        {
            return await _adminRepo.GetDanhSachVaiTroAsync();
        }

        // ══════════════════════════════════════════
        // VẬT LIỆU
        // ══════════════════════════════════════════

        public async Task<List<VatLieuListDto>> GetDanhSachVatLieuAsync()
        {
            return await _adminRepo.GetDanhSachVatLieuAsync();
        }

        public async Task<ServiceResult> UpdateVatLieuAsync(UpdateVatLieuDto dto, int nguoiThucHienId, string? ip)
        {
            var errors = new List<string>();

            if (dto.Id <= 0)
                errors.Add("ID vật liệu không hợp lệ.");

            if (string.IsNullOrWhiteSpace(dto.TenVatLieu))
                errors.Add("Tên vật liệu là bắt buộc.");

            if (dto.DonViTinhId <= 0)
                errors.Add("Đơn vị tính là bắt buộc.");

            if (dto.DonGia < 0)
                errors.Add("Đơn giá phải >= 0.");

            if (errors.Count > 0)
                return new ServiceResult { Success = false, Message = "Dữ liệu không hợp lệ.", Errors = errors };

            var result = await _adminRepo.UpdateVatLieuAsync(dto);
            if (!result)
                return new ServiceResult { Success = false, Message = "Không tìm thấy vật liệu." };

            await _logRepo.WriteLogAsync(nguoiThucHienId, "SUA", "VAT_LIEU", dto.Id,
                $"Cập nhật vật liệu ID={dto.Id} - {dto.TenVatLieu.Trim()}", ip);

            return new ServiceResult { Success = true, Message = "Cập nhật vật liệu thành công!" };
        }

        public async Task<ServiceResult> DeleteVatLieuAsync(int id, int nguoiThucHienId, string? ip)
        {
            var result = await _adminRepo.DeleteVatLieuAsync(id);
            if (!result)
                return new ServiceResult { Success = false, Message = "Không thể xóa vật liệu (có thể còn tồn kho > 0)." };

            await _logRepo.WriteLogAsync(nguoiThucHienId, "XOA", "VAT_LIEU", id,
                $"Ngừng sử dụng vật liệu ID={id}", ip);

            return new ServiceResult { Success = true, Message = "Ngừng sử dụng vật liệu thành công!" };
        }
    }
}
