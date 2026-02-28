using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LANHossting.Domain.Entities.Buoy
{
    /// <summary>
    /// Tuyến luồng hàng hải (QN, ĐTN, PQ, NT, CNV...)
    /// Table: DmTuyenLuong
    /// </summary>
    [Table("DmTuyenLuong")]
    public class DmTuyenLuong
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string MaTuyen { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string TenTuyen { get; set; } = string.Empty;

        public string? MoTa { get; set; }

        public int? ThuTuHienThi { get; set; }

        [MaxLength(50)]
        public string TrangThai { get; set; } = "Hoạt động";

        public DateTime NgayTao { get; set; } = DateTime.Now;

        [MaxLength(100)]
        public string? NguoiTao { get; set; }

        public DateTime? NgayCapNhat { get; set; }

        [MaxLength(100)]
        public string? NguoiCapNhat { get; set; }

        // Navigation
        public virtual ICollection<DmViTriPhaoBH> ViTriPhaoList { get; set; } = new List<DmViTriPhaoBH>();
    }
}
