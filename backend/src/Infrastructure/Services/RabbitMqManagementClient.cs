using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMqVirtualOffice.Contracts;
using RabbitMqVirtualOffice.Infrastructure.Configuration;

namespace RabbitMqVirtualOffice.Infrastructure.Services;

public class RabbitMqManagementClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<RabbitMqManagementClient> _logger;
    private readonly RabbitMqOptions _options;

    public RabbitMqManagementClient(
        HttpClient httpClient,
        IOptions<RabbitMqOptions> options,
        ILogger<RabbitMqManagementClient> logger)
    {
        _options = options.Value;
        _logger = logger;
        _httpClient = httpClient;

        var scheme = _options.UseSsl ? "https" : "http";
        _httpClient.BaseAddress = new Uri($"{scheme}://{_options.Host}:{_options.Port}");
        var authToken = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_options.Username}:{_options.Password}"));
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authToken);
    }

    public async Task<bool> CheckConnectivityAsync(CancellationToken ct = default)
    {
        try
        {
            var res = await _httpClient.GetAsync("/api/overview", ct);
            return res.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to connect to RabbitMQ Management API.");
            return false;
        }
    }
}
