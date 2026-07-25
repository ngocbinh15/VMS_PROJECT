using Microsoft.AspNetCore.SignalR;

namespace LANHossting.Hubs
{
    public class KhoHub : Hub
    {
        public async Task SendStockUpdate(int khoId, string? message)
        {
            await Clients.All.SendAsync("ReceiveStockUpdate", khoId, message);
        }

        public async Task SendPendingTicketsUpdate(string? maPhieu, string? nguoiThucHien, string? loaiHanhDong)
        {
            await Clients.All.SendAsync("ReceivePendingTicketsUpdate", maPhieu, nguoiThucHien, loaiHanhDong);
        }

        public async Task SendTicketStatusUpdate(string maPhieu, string trangThai, string? lyDo)
        {
            await Clients.All.SendAsync("ReceiveTicketStatusUpdate", maPhieu, trangThai, lyDo);
        }

        public async Task SendLogUpdate(string? message)
        {
            await Clients.All.SendAsync("ReceiveLogUpdate", message);
        }
    }
}
