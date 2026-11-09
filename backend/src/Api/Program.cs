using Microsoft.AspNetCore.SignalR;
using RabbitMqVirtualOffice.Api.Hubs;
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

app.MapGet("/api/snapshot", async (IBrokerMonitoringService service, CancellationToken ct) =>
{
    var snapshot = await service.GetLatestSnapshotAsync(ct);
    return Results.Ok(snapshot);
});

app.MapPost("/api/mode", async (SimulationTrafficMode mode, IBrokerMonitoringService service, IHubContext<MonitoringHub, IMonitoringClient> hubContext, CancellationToken ct) =>
{
    await service.SetSimulationModeAsync(mode, ct);
    var snapshot = await service.GetLatestSnapshotAsync(ct);
    await hubContext.Clients.All.ReceiveBrokerSnapshot(snapshot);
    return Results.Ok(new { message = $"Simulation mode changed to {mode}", snapshot });
});

app.MapHub<MonitoringHub>("/hubs/monitoring");

app.Run();

public partial class Program { }
