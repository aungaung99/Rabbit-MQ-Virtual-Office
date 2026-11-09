using Microsoft.AspNetCore.SignalR;
using RabbitMqVirtualOffice.Api.Hubs;
using RabbitMqVirtualOffice.Application.Services;
using RabbitMqVirtualOffice.Contracts;
using RabbitMqVirtualOffice.Infrastructure.Services;

namespace RabbitMqVirtualOffice.Api.Services;

public class RabbitMqPollingService : BackgroundService
{
    private readonly RabbitMqManagementClient _client;
    private readonly IBrokerMonitoringService _monitoringService;
    private readonly IHubContext<MonitoringHub, IMonitoringClient> _hubContext;
    private readonly ILogger<RabbitMqPollingService> _logger;

    public RabbitMqPollingService(
        RabbitMqManagementClient client,
        IBrokerMonitoringService monitoringService,
        IHubContext<MonitoringHub, IMonitoringClient> hubContext,
        ILogger<RabbitMqPollingService> logger)
    {
        _client = client;
        _monitoringService = monitoringService;
        _hubContext = hubContext;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("RabbitMQ Polling Background Service started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var liveSnapshot = await _client.GetLiveSnapshotAsync(stoppingToken);
                if (liveSnapshot != null)
                {
                    // Push live data to SignalR clients
                    await _hubContext.Clients.All.ReceiveBrokerSnapshot(liveSnapshot);
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Polling cycle error.");
            }

            await Task.Delay(2000, stoppingToken);
        }
    }
}
