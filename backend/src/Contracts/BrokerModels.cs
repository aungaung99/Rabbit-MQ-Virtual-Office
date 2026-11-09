namespace RabbitMqVirtualOffice.Contracts;

public enum SimulationTrafficMode
{
    DemoQuiet,
    DemoNormal,
    DemoSpike,
    DemoErrorSpike,
    LiveMetrics,
    LiveTraced
}

public record QueueMetricDto(
    string Name,
    string VHost,
    long MessagesReady,
    long MessagesUnacknowledged,
    long MessagesTotal,
    double PublishRate,
    double DeliverRate,
    double AckRate,
    int ConsumersCount,
    string State = "running",
    bool HasDeadLetterQueue = false
);

public record ExchangeMetricDto(
    string Name,
    string Type,
    double PublishInRate,
    double PublishOutRate
);

public record ConsumerMetricDto(
    string ConsumerTag,
    string QueueName,
    string ChannelName,
    int PrefetchCount,
    bool IsActive
);

public record BrokerSnapshotDto(
    DateTime Timestamp,
    SimulationTrafficMode Mode,
    bool IsConnectedToBroker,
    string BrokerVersion,
    IReadOnlyList<QueueMetricDto> Queues,
    IReadOnlyList<ExchangeMetricDto> Exchanges,
    IReadOnlyList<ConsumerMetricDto> Consumers,
    double TotalPublishRate,
    double TotalDeliverRate,
    double TotalAckRate,
    long TotalBacklog
);
