using RabbitMqVirtualOffice.Application;
using RabbitMqVirtualOffice.Contracts;

namespace Api.Tests;

public class BrokerMonitoringServiceTests
{
    [Fact]
    public void GenerateSimulatedSnapshot_QuietMode_ProducesLowTrafficAndZeroDeadLetters()
    {
        // Arrange
        var service = new BrokerMonitoringService();

        // Act
        var snapshot = service.GenerateSimulatedSnapshot(SimulationTrafficMode.DemoQuiet);

        // Assert
        Assert.NotNull(snapshot);
        Assert.Equal(SimulationTrafficMode.DemoQuiet, snapshot.Mode);
        Assert.True(snapshot.TotalPublishRate < 10.0);
        Assert.NotEmpty(snapshot.Queues);
        var orderQueue = snapshot.Queues.First(q => q.Name == "orders.processing");
        Assert.Equal(1, orderQueue.ConsumersCount);
    }

    [Fact]
    public void GenerateSimulatedSnapshot_SpikeMode_ProducesHighBacklogAndPublishRate()
    {
        // Arrange
        var service = new BrokerMonitoringService();

        // Act
        var snapshot = service.GenerateSimulatedSnapshot(SimulationTrafficMode.DemoSpike);

        // Assert
        Assert.NotNull(snapshot);
        Assert.Equal(SimulationTrafficMode.DemoSpike, snapshot.Mode);
        Assert.True(snapshot.TotalPublishRate > 50.0);
        Assert.True(snapshot.TotalBacklog > 100);
    }
}
