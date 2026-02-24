using LANHossting.Application.DTOs;
using LANHossting.Application.Interfaces;

namespace LANHossting.Application.Services
{
    /// <summary>
    /// Service for VatLieu operations.
    /// Contains ALL business rules:
    ///   - Required field validation
    ///   - DonGia >= 0
    ///   - Duplicate check (MaVatLieu exact OR TenVatLieu case-insensitive)
    ///   - Default MucToiThieu = 5 when null or 0
    /// Controller NEVER has this logic.
    /// </summary>
    public class VatLieuService : IVatLieuService
    {
        private readonly IVatLieuRepository _repository;
        private const decimal DEFAULT_MUC_TOI_THIEU = 5m;

        public VatLieuService(IVatLieuRepository repository)
        {
            _repository = repository;
        }

        /// <inheritdoc />
        public async Task<ServiceResult> CreateVatLieuAsync(CreateVatLieuDto dto)
        {
            var errors = new List<string>();

            // ── Backend Validation ─────────────────────────────
            if (string.IsNullOrWhiteSpace(dto.MaVatLieu))
                errors.Add("Mã vật tư là bắt buộc.");

            if (string.IsNullOrWhiteSpace(dto.TenVatLieu))
                errors.Add("Tên vật tư là bắt buộc.");

            if (dto.NhomVatLieuId == null || dto.NhomVatLieuId <= 0)
                errors.Add("Nhóm vật tư là bắt buộc.");

            if (dto.DonViTinhId <= 0)
                errors.Add("Đơn vị tính là bắt buộc.");

            if (dto.DonGia < 0)
                errors.Add("Đơn giá phải >= 0.");

            if (dto.KhoId <= 0)
                errors.Add("Kho là bắt buộc.");

            if (errors.Count > 0)
            {
                return new ServiceResult
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ.",
                    Errors = errors
                };
            }

            // ── Duplicate Check ────────────────────────────────
            // MaVatLieu exact match OR TenVatLieu case-insensitive
            var exists = await _repository.ExistsAsync(
                dto.MaVatLieu.Trim(),
                dto.TenVatLieu.Trim());

            if (exists)
            {
                return new ServiceResult
                {
                    Success = false,
                    Message = "Vật tư đã tồn tại trong hệ thống.",
                    Errors = new List<string> { "Vật tư đã tồn tại trong hệ thống (trùng Mã vật tư hoặc Tên vật tư)." }
                };
            }

            // ── Default Value Rule ─────────────────────────────
            // If MucToiThieu is null or 0 → set = 5
            if (!dto.MucToiThieu.HasValue || dto.MucToiThieu.Value == 0)
            {
                dto.MucToiThieu = DEFAULT_MUC_TOI_THIEU;
            }

            // ── Persist ────────────────────────────────────────
            await _repository.CreateAsync(dto);

            return new ServiceResult
            {
                Success = true,
                Message = "Thêm vật tư thành công!"
            };
        }

        /// <inheritdoc />
        public async Task<List<DropdownItemDto>> GetNhomVatLieuAsync()
        {
            return await _repository.GetNhomVatLieuAsync();
        }

        /// <inheritdoc />
        public async Task<List<DropdownItemDto>> GetDonViTinhAsync()
        {
            return await _repository.GetDonViTinhAsync();
        }
    }
}
