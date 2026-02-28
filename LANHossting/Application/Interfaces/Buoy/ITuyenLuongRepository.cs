namespace LANHossting.Application.Interfaces.Buoy
{
    /// <summary>
    /// Repository cho tuyến luồng.
    /// Mở rộng trong tương lai cho chức năng Phân luồng.
    /// </summary>
    public interface ITuyenLuongRepository
    {
        Task<List<Domain.Entities.Buoy.DmTuyenLuong>> GetAllActiveAsync();
        Task<Domain.Entities.Buoy.DmTuyenLuong?> GetByIdWithViTriAsync(int id);
    }
}
