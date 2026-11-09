using RabbitMqVirtualOffice.Contracts;

namespace RabbitMqVirtualOffice.Application.Services;

public interface IBrokerMonitoringService
{
    Task<BrokerSnapshotDto> GetLatestSnapshotAsync(CancellationToken cancellationToken = default);
    Task SetSimulationModeAsync(SimulationTrafficMode mode, CancellationToken cancellationToken = default);
    BrokerSnapshotDto GenerateSimulatedSnapshot(SimulationTrafficMode mode);
}
