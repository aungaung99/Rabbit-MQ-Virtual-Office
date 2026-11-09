using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
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

    public async Task<BrokerSnapshotDto?> GetLiveSnapshotAsync(CancellationToken ct = default)
    {
        try
        {
            var overviewRes = await _httpClient.GetAsync("/api/overview", ct);
            if (!overviewRes.IsSuccessStatusCode) return null;

            var overviewJson = await overviewRes.Content.ReadAsStringAsync(ct);
            var overviewNode = JsonNode.Parse(overviewJson);

            var rabbitmqVersion = overviewNode?["rabbitmq_version"]?.ToString() ?? "3.13";

            // Parse queues
            var queuesRes = await _httpClient.GetAsync("/api/queues", ct);
            var queuesList = new List<QueueMetricDto>();
            double totalPub = 0;
            double totalDeliv = 0;
            double totalAck = 0;
            long totalBacklog = 0;

            if (queuesRes.IsSuccessStatusCode)
            {
                var qJson = await queuesRes.Content.ReadAsStringAsync(ct);
                var qArray = JsonNode.Parse(qJson)?.AsArray();
                if (qArray != null)
                {
                    foreach (var item in qArray)
                    {
                        var name = item?["name"]?.ToString() ?? "unknown";
                        var vhost = item?["vhost"]?.ToString() ?? "/";
                        var ready = item?["messages_ready"]?.GetValue<long>() ?? 0;
                        var unack = item?["messages_unacknowledged"]?.GetValue<long>() ?? 0;
                        var total = item?["messages"]?.GetValue<long>() ?? (ready + unack);
                        var consumers = item?["consumers"]?.GetValue<int>() ?? 0;
                        var state = item?["state"]?.ToString() ?? "running";

                        var msgStats = item?["message_stats"];
                        var pubRate = msgStats?["publish_details"]?["rate"]?.GetValue<double>() ?? 0;
                        var delivRate = msgStats?["deliver_get_details"]?["rate"]?.GetValue<double>() ?? 0;
                        var ackRate = msgStats?["ack_details"]?["rate"]?.GetValue<double>() ?? 0;

                        totalPub += pubRate;
                        totalDeliv += delivRate;
                        totalAck += ackRate;
                        totalBacklog += total;

                        queuesList.Add(new QueueMetricDto(
                            Name: name,
                            VHost: vhost,
                            MessagesReady: ready,
                            MessagesUnacknowledged: unack,
                            MessagesTotal: total,
                            PublishRate: Math.Round(pubRate, 1),
                            DeliverRate: Math.Round(delivRate, 1),
                            AckRate: Math.Round(ackRate, 1),
                            ConsumersCount: consumers,
                            State: state,
                            HasDeadLetterQueue: name.Contains("dlq")
                        ));
                    }
                }
            }

            // Parse exchanges
            var exchangesRes = await _httpClient.GetAsync("/api/exchanges", ct);
            var exchangesList = new List<ExchangeMetricDto>();
            if (exchangesRes.IsSuccessStatusCode)
            {
                var exJson = await exchangesRes.Content.ReadAsStringAsync(ct);
                var exArray = JsonNode.Parse(exJson)?.AsArray();
                if (exArray != null)
                {
                    foreach (var item in exArray)
                    {
                        var name = item?["name"]?.ToString();
                        if (string.IsNullOrEmpty(name)) name = "(default)";
                        var type = item?["type"]?.ToString() ?? "direct";
                        var msgStats = item?["message_stats"];
                        var pubIn = msgStats?["publish_in_details"]?["rate"]?.GetValue<double>() ?? 0;
                        var pubOut = msgStats?["publish_out_details"]?["rate"]?.GetValue<double>() ?? 0;

                        exchangesList.Add(new ExchangeMetricDto(
                            Name: name,
                            Type: type,
                            PublishInRate: Math.Round(pubIn, 1),
                            PublishOutRate: Math.Round(pubOut, 1)
                        ));
                    }
                }
            }

            // Parse consumers
            var consumersRes = await _httpClient.GetAsync("/api/consumers", ct);
            var consumersList = new List<ConsumerMetricDto>();
            if (consumersRes.IsSuccessStatusCode)
            {
                var cJson = await consumersRes.Content.ReadAsStringAsync(ct);
                var cArray = JsonNode.Parse(cJson)?.AsArray();
                if (cArray != null)
                {
                    foreach (var item in cArray)
                    {
                        var tag = item?["consumer_tag"]?.ToString() ?? "unknown";
                        var queueName = item?["queue"]?["name"]?.ToString() ?? "";
                        var channel = item?["channel_details"]?["name"]?.ToString() ?? "";
                        var prefetch = item?["prefetch_count"]?.GetValue<int>() ?? 0;

                        consumersList.Add(new ConsumerMetricDto(
                            ConsumerTag: tag,
                            QueueName: queueName,
                            ChannelName: channel,
                            PrefetchCount: prefetch,
                            IsActive: true
                        ));
                    }
                }
            }

            return new BrokerSnapshotDto(
                Timestamp: DateTime.UtcNow,
                Mode: SimulationTrafficMode.LiveMetrics,
                IsConnectedToBroker: true,
                BrokerVersion: $"RabbitMQ {rabbitmqVersion} (Live Broker)",
                Queues: queuesList,
                Exchanges: exchangesList,
                Consumers: consumersList,
                TotalPublishRate: Math.Round(totalPub, 1),
                TotalDeliverRate: Math.Round(totalDeliv, 1),
                TotalAckRate: Math.Round(totalAck, 1),
                TotalBacklog: totalBacklog
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error polling RabbitMQ Management API.");
            return null;
        }
    }

    public async Task<bool> PublishTestMessageAsync(string exchange, string routingKey, string payload, CancellationToken ct = default)
    {
        try
        {
            var encodedVhost = Uri.EscapeDataString("/");
            var url = $"/api/exchanges/{encodedVhost}/{Uri.EscapeDataString(exchange)}/publish";
            var body = new
            {
                properties = new { delivery_mode = 2 },
                routing_key = routingKey,
                payload = payload,
                payload_encoding = "string"
            };

            var content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
            var res = await _httpClient.PostAsync(url, content, ct);
            return res.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish test message.");
            return false;
        }
    }

    public async Task<bool> DeclareTestQueueAsync(string queueName, CancellationToken ct = default)
    {
        try
        {
            var encodedVhost = Uri.EscapeDataString("/");
            var url = $"/api/queues/{encodedVhost}/{Uri.EscapeDataString(queueName)}";
            var body = new
            {
                durable = true,
                auto_delete = false
            };
            var content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
            var res = await _httpClient.PutAsync(url, content, ct);
            return res.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to declare queue.");
            return false;
        }
    }
}
