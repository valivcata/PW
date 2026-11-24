using Gatherly.Application.Notifications;
using Gatherly.Domain.Enums;
using Gatherly.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Gatherly.Infrastructure.Notifications;

public class RsvpNotifier(
    ApplicationDbContext db,
    IEmailSender emailSender,
    IOptions<EmailOptions> emailOptions,
    IOptions<ReminderOptions> reminderOptions,
    ILogger<RsvpNotifier> logger) : IRsvpNotifier
{
    public async Task NotifyAsync(Guid eventId, string userId, RsvpStatus status, int? waitlistPosition, CancellationToken cancellationToken = default)
    {
        if (status is not (RsvpStatus.Going or RsvpStatus.Waitlisted)) return;

        try
        {
            var attendee = await db.EventAttendees
                .Include(a => a.User)
                .Include(a => a.Event)
                .FirstOrDefaultAsync(a => a.EventId == eventId && a.UserId == userId, cancellationToken);
            if (attendee is null || string.IsNullOrEmpty(attendee.User.Email)) return;

            var e = attendee.Event;
            var now = DateTime.UtcNow;
            var link = EmailFormatting.EventLink(emailOptions.Value.FrontendBaseUrl, e.Id);
            var name = EmailFormatting.Encode(attendee.User.DisplayName);
            var title = EmailFormatting.Encode(e.Title);
            var details = $"""
                <p>Când: {EmailFormatting.LongDate(e.StartUtc)}<br>
                   Unde: {EmailFormatting.Encode(e.VenueName)}, {EmailFormatting.Encode(e.Address)}</p>
                <p><a href="{link}">Vezi evenimentul</a></p>
                """;

            string subject, body;
            if (status == RsvpStatus.Going)
            {
                var lead = reminderOptions.Value.LeadHours;
                var startsSoon = e.StartUtc <= now.AddHours(lead);
                var reminderLine = startsSoon
                    ? $"<p>Evenimentul începe <b>{EmailFormatting.RelativeDay(e.StartUtc, now).ToLowerInvariant()} la {EmailFormatting.Time(e.StartUtc)}</b>, deci acesta este și reminderul tău. Ne vedem acolo!</p>"
                    : $"<p>Îți vom trimite un <b>reminder pe email cu {lead:0} de ore înainte</b> de începerea evenimentului.</p>";

                subject = $"Te-ai înscris la {e.Title}";
                body = EmailFormatting.Layout($"""
                    <p>Salut, {name}!</p>
                    <p>Ți-am înregistrat participarea la <b>{title}</b>. ✅</p>
                    {details}
                    {reminderLine}
                    <p style="color:#777;font-size:13px">Te-ai răzgândit? Anulează participarea de pe pagina evenimentului,
                       ca locul să ajungă la altcineva.</p>
                    """);

                // Starts within the reminder window: this email already is the reminder, so don't send a second one.
                if (startsSoon && attendee.ReminderSentAtUtc is null)
                {
                    attendee.ReminderSentAtUtc = now;
                    await db.SaveChangesAsync(cancellationToken);
                }
            }
            else
            {
                subject = $"Ești pe lista de așteptare: {e.Title}";
                body = EmailFormatting.Layout($"""
                    <p>Salut, {name}!</p>
                    <p><b>{title}</b> este plin momentan, așa că te-am trecut pe lista de așteptare,
                       pe locul <b>#{waitlistPosition}</b>.</p>
                    {details}
                    <p>Când se eliberează un loc, îl primești automat și te anunțăm pe email.</p>
                    """);
            }

            await emailSender.SendAsync(attendee.User.Email, attendee.User.DisplayName, subject, body, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // The RSVP is already saved; a mail problem must not turn it into an error for the user.
            logger.LogWarning(ex, "Could not send RSVP email for event {EventId} to user {UserId}", eventId, userId);
        }
    }
}
