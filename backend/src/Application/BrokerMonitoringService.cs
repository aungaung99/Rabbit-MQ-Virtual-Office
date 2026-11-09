using RabbitMqVirtualOffice.Application.Services;
using RabbitMqVirtualOffice.Contracts;

namespace RabbitMqVirtualOffice.Application;

public class BrokerMonitoringService : IBrokerMonitoringService
{
    private SimulationTrafficMode _currentMode = SimulationTrafficMode.DemoNormal;
    private long _simulatedCounter = 0;
    private readonly Random _random = new(42); // Deterministic seed

    public Task<BrokerSnapshotDto> GetLatestSnapshotAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(GenerateSimulatedSnapshot(_currentMode));
    }

    public Task SetSimulationModeAsync(SimulationTrafficMode mode, CancellationToken cancellationToken = default)
    {
        _currentMode = mode;
        return Task.CompletedTask;
    }

    public BrokerSnapshotDto GenerateSimulatedSnapshot(SimulationTrafficMode mode)
    {
        Interlocked.Increment(ref _simulatedCounter);
        var now = DateTime.UtcNow;

        (double pubRate, double delivRate, double ackRate, long backlogBase, int consumers) = mode switch
        {
            SimulationTrafficMode.DemoQuiet => (2.5, 2.5, 2.5, 1L, 1),
            SimulationTrafficMode.DemoNormal => (15.0, 14.8, 14.8, 8L, 3),
            SimulationTrafficMode.DemoSpike => (85.0, 35.0, 34.0, 145L, 3),
            SimulationTrafficMode.DemoErrorSpike => (30.0, 28.0, 5.0, 60L, 2),
            _ => (12.0, 12.0, 12.0, 5L, 2)
        };

        // Add slight realistic jitter
        var jitter = (_random.NextDouble() - 0.5) * 0.1 * pubRate;
        pubRate = Math.Max(0.5, pubRate + jitter);

        var queues = new List<QueueMetricDto>
        {
            new(
                Name: "orders.processing",
                VHost: "/",
                MessagesReady: backlogBase,
                MessagesUnacknowledged: Math.Min(consumers * 2, backlogBase),
                MessagesTotal: backlogBase + (consumers * 2),
                PublishRate: Math.Round(pubRate * 0.7, 1),
                DeliverRate: Math.Round(delivRate * 0.7, 1),
                AckRate: Math.Round(ackRate * 0.7, 1),
                ConsumersCount: consumers,
                State: "running",
                HasDeadLetterQueue: true
            ),
            new(
                Name: "notifications.email",
                VHost: "/",
                MessagesReady: Math.Max(0, backlogBase / 3),
                MessagesUnacknowledged: 1,
                MessagesTotal: Math.Max(1, backlogBase / 3 + 1),
                PublishRate: Math.Round(pubRate * 0.3, 1),
                DeliverRate: Math.Round(delivRate * 0.3, 1),
                AckRate: Math.Round(ackRate * 0.3, 1),
                ConsumersCount: 1,
                State: "running"
            ),
            new(
                Name: "orders.dlq",
                VHost: "/",
                MessagesReady: mode == SimulationTrafficMode.DemoErrorSpike ? 24 : 1,
                MessagesUnacknowledged: 0,
                MessagesTotal: mode == SimulationTrafficMode.DemoErrorSpike ? 24 : 1,
                PublishRate: mode == SimulationTrafficMode.DemoErrorSpike ? 15.0 : 0.1,
                DeliverRate: 0,
                AckRate: 0,
                ConsumersCount: 0,
                State: "idle"
            )
        };

        var exchanges = new List<ExchangeMetricDto>
        {
            new("amq.direct", "direct", pubRate, pubRate),
            new("orders.exchange", "topic", pubRate * 0.7, pubRate * 0.7),
            new("notifications.exchange", "fanout", pubRate * 0.3, pubRate * 0.3)
        };

        var consumersList = new List<ConsumerMetricDto>();
        for (int i = 1; i <= consumers; i++)
        {
            consumersList.Add(new(
                ConsumerTag: $"worker-agent-{i}",
                QueueName: "orders.processing",
                ChannelName: $"127.0.0.1:{50000 + i}",
                PrefetchCount: 10,
                IsActive: true
            ));
        }

        long totalBacklog = queues.Sum(q => q.MessagesTotal);

        return new BrokerSnapshotDto(
            Timestamp: now,
            Mode: mode,
            IsConnectedToBroker: mode == SimulationTrafficMode.LiveMetrics,
            BrokerVersion: "RabbitMQ 3.13.7 (Erlang 26.2)",
            Queues: queues,
            Exchanges: exchanges,
            Consumers: consumersList,
            TotalPublishRate: Math.Round(pubRate, 1),
            TotalDeliverRate: Math.Round(delivRate, 1),
            TotalAckRate: Math.Round(ackRate, 1),
            TotalBacklog: totalBacklog
        );
    }
}
