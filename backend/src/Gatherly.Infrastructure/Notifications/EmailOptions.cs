namespace Gatherly.Infrastructure.Notifications;

public class EmailOptions
{
    public const string SectionName = "Email";

    /// <summary>SMTP server. Leave empty to only log emails instead of sending them.</summary>
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 25;
    public bool EnableSsl { get; set; }
    public string? UserName { get; set; }
    public string? Password { get; set; }
    public string FromAddress { get; set; } = "no-reply@gatherly.dev";
    public string FromName { get; set; } = "Gatherly";

    /// <summary>Base URL of the frontend, used for links inside emails.</summary>
    public string FrontendBaseUrl { get; set; } = "http://localhost:3000";
}
