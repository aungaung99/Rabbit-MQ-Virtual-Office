namespace RabbitMqVirtualOffice.Infrastructure.Configuration;

public class RabbitMqOptions
{
    public const string SectionName = "RabbitMq";
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 15672;
    public string Username { get; set; } = "guest";
    public string Password { get; set; } = "guest";
    public bool UseSsl { get; set; } = false;
    public int PollingIntervalMs { get; set; } = 2000;
}
