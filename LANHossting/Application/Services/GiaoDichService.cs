using LANHossting.Application.DTOs;
using LANHossting.Application.Interfaces;

namespace LANHossting.Application.Services
{
    /// <summary>
    /// Service for inventory transactions.
    /// Validates business rules BEFORE delegating to IGiaoDichRepository.
    /// 
    /// Rules enforced:
    ///   - KhoId > 0
    ///   - At least 1 item
    ///   - Each item: valid LoaiPhieu, SoLuong > 0
    ///   - DIEUCHUYEN: KhoNhanId required and != KhoId
    ///   - NEVER modifies TenVatLieu
    /// </summary>
    public class GiaoDichService : IGiaoDichService
    {
        private readonly IGiaoDichRepository _repository;

        private static readonly HashSet<string> ValidLoaiPhieu = new(StringComparer.OrdinalIgnoreCase)
        {
            "NHAP", "XUAT", "DIEUCHUYEN"
        };

        public GiaoDichService(IGiaoDichRepository repository)
        {
            _repository = repository;
        }

        public async Task<ServiceResult> ExecuteAsync(
            GiaoDichBatchDto batch, int taiKhoanId, int phienLamViecId)
        {
            var errors = new List<string>();

            // ── Top-level validation ─────────────────────────
            if (batch.KhoId <= 0)
                errors.Add("Kho không hợp lệ.");

            if (batch.Items == null || batch.Items.Count == 0)
                errors.Add("Danh sách giao dịch không được rỗng.");

            if (taiKhoanId <= 0)
                errors.Add("Phiên đăng nhập không hợp lệ.");

            if (phienLamViecId <= 0)
                errors.Add("Phiên làm việc không hợp lệ.");

            if (errors.Count > 0)
                return new ServiceResult { Success = false, Message = "Dữ liệu không hợp lệ.", Errors = errors };

            // ── Per-item validation ──────────────────────────
            for (int i = 0; i < batch.Items.Count; i++)
            {
                var item = batch.Items[i];
                var prefix = $"Dòng {i + 1}";

                if (item.VatLieuId <= 0)
                    errors.Add($"{prefix}: Vật tư không hợp lệ.");

                if (!ValidLoaiPhieu.Contains(item.LoaiPhieu))
                    errors.Add($"{prefix}: Loại phiếu '{item.LoaiPhieu}' không hợp lệ. Chỉ chấp nhận: NHAP, XUAT, DIEUCHUYEN.");

                if (item.SoLuong <= 0)
                    errors.Add($"{prefix}: Số lượng phải > 0.");

                if (item.LoaiPhieu.Equals("DIEUCHUYEN", StringComparison.OrdinalIgnoreCase))
                {
                    if (!item.KhoNhanId.HasValue || item.KhoNhanId.Value <= 0)
                        errors.Add($"{prefix}: Kho đích là bắt buộc cho điều chuyển.");
                    else if (item.KhoNhanId.Value == batch.KhoId)
                        errors.Add($"{prefix}: Kho đích không được trùng kho nguồn.");
                }
            }

            if (errors.Count > 0)
                return new ServiceResult { Success = false, Message = "Dữ liệu giao dịch không hợp lệ.", Errors = errors };

            // ── Delegate to repository (runs in DB transaction) ──
            return await _repository.ExecuteBatchAsync(batch, taiKhoanId, phienLamViecId);
        }
    }
}
