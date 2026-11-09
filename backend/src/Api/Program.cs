using Microsoft.AspNetCore.SignalR;
using RabbitMqVirtualOffice.Api.Hubs;
using RabbitMqVirtualOffice.Api.Services;
using RabbitMqVirtualOffice.Application;
using RabbitMqVirtualOffice.Application.Services;
using RabbitMqVirtualOffice.Contracts;
using RabbitMqVirtualOffice.Infrastructure.Configuration;
using RabbitMqVirtualOffice.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<RabbitMqOptions>(
    builder.Configuration.GetSection(RabbitMqOptions.SectionName));

builder.Services.AddHttpClient<RabbitMqManagementClient>();
builder.Services.AddSingleton<IBrokerMonitoringService, BrokerMonitoringService>();
builder.Services.AddHostedService<RabbitMqPollingService>();
builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "http://127.0.0.1:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("CorsPolicy");

// REST Endpoints
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", version = "0.1.0" }));

app.MapGet("/api/snapshot", async (IBrokerMonitoringService service, RabbitMqManagementClient client, CancellationToken ct) =>
{
    var live = await client.GetLiveSnapshotAsync(ct);
    if (live != null) return Results.Ok(live);

    var simulated = await service.GetLatestSnapshotAsync(ct);
    return Results.Ok(simulated);
});

app.MapPost("/api/mode", async (SimulationTrafficMode mode, IBrokerMonitoringService service, IHubContext<MonitoringHub, IMonitoringClient> hubContext, CancellationToken ct) =>
{
    await service.SetSimulationModeAsync(mode, ct);
    var snapshot = await service.GetLatestSnapshotAsync(ct);
    await hubContext.Clients.All.ReceiveBrokerSnapshot(snapshot);
    return Results.Ok(new { message = $"Simulation mode changed to {mode}", snapshot });
});

// Setup sample demo queues in RabbitMQ
app.MapPost("/api/rabbitmq/setup-demo-queues", async (RabbitMqManagementClient client, CancellationToken ct) =>
{
    await client.DeclareTestQueueAsync("orders.checkout", ct);
    await client.DeclareTestQueueAsync("notifications.push", ct);
    await client.DeclareTestQueueAsync("orders.dlq", ct);

    // Publish initial test messages
    for (int i = 1; i <= 5; i++)
    {
        await client.PublishTestMessageAsync("amq.default", "orders.checkout", $"{{\"orderId\": {1000 + i}, \"item\": \"Parcel Box\", \"status\": \"new\"}}", ct);
    }

    return Results.Ok(new { message = "Demo queues and test messages created in RabbitMQ!" });
});

// Publish test message endpoint
app.MapPost("/api/rabbitmq/publish-test", async (RabbitMqManagementClient client, CancellationToken ct) =>
{
    var success = await client.PublishTestMessageAsync("amq.default", "orders.checkout", $"{{\"test\": true, \"timestamp\": \"{DateTime.UtcNow:O}\"}}", ct);
    return Results.Ok(new { success, message = "Test message sent to orders.checkout" });
});

app.MapHub<MonitoringHub>("/hubs/monitoring");

app.Run();

public partial class Program { }
