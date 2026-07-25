using Microsoft.AspNetCore.SignalR;

namespace LANHossting.Hubs
{
    public class KhoHub : Hub
    {
        public async Task SendStockUpdate(int khoId)
        {
            await Clients.All.SendAsync("ReceiveStockUpdate", khoId);
        }

        public async Task SendPendingTicketsUpdate()
        {
            await Clients.All.SendAsync("ReceivePendingTicketsUpdate");
        }

        public async Task SendLogUpdate()
        {
            await Clients.All.SendAsync("ReceiveLogUpdate");
        }
    }
}
