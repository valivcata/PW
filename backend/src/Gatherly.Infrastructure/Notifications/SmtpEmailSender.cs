using System.Net;
using System.Net.Mail;
using Gatherly.Application.Notifications;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Gatherly.Infrastructure.Notifications;

public class SmtpEmailSender(IOptions<EmailOptions> options, ILogger<SmtpEmailSender> logger) : IEmailSender
{
    public async Task SendAsync(string toEmail, string toName, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var opts = options.Value;
        if (string.IsNullOrWhiteSpace(opts.Host))
        {
            logger.LogInformation("Email not sent (Email:Host is empty). To: {To}, subject: {Subject}", toEmail, subject);
            return;
        }

        using var message = new MailMessage
        {
            From = new MailAddress(opts.FromAddress, opts.FromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true,
        };
        message.To.Add(new MailAddress(toEmail, toName));

        using var client = new SmtpClient(opts.Host, opts.Port)
        {
            EnableSsl = opts.EnableSsl,
            Timeout = 10_000,
        };
        if (!string.IsNullOrEmpty(opts.UserName))
            client.Credentials = new NetworkCredential(opts.UserName, opts.Password);

        await client.SendMailAsync(message, cancellationToken);
        logger.LogInformation("Email sent to {To}: {Subject}", toEmail, subject);
    }
}
