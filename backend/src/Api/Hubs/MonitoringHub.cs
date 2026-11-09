using Microsoft.AspNetCore.SignalR;
using RabbitMqVirtualOffice.Contracts;

namespace RabbitMqVirtualOffice.Api.Hubs;

public interface IMonitoringClient
{
    Task ReceiveBrokerSnapshot(BrokerSnapshotDto snapshot);
    Task ReceiveAlert(string message, string severity);
}

public class MonitoringHub : Hub<IMonitoringClient>
{
    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }
}
