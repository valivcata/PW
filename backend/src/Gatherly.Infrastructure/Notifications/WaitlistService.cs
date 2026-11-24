using System.Net;
using Gatherly.Application.Notifications;
using Gatherly.Domain.Entities;
using Gatherly.Domain.Enums;
using Gatherly.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Gatherly.Infrastructure.Notifications;

public class WaitlistService(
    ApplicationDbContext db,
    IEmailSender emailSender,
    IOptions<EmailOptions> emailOptions,
    ILogger<WaitlistService> logger) : IWaitlistService
{
    public async Task<int> PromoteAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        var e = await db.Events.FirstOrDefaultAsync(x => x.Id == eventId, cancellationToken);
        if (e is null || e.EndUtc < DateTime.UtcNow) return 0;

        var waitlist = db.EventAttendees
            .Include(a => a.User)
            .Where(a => a.EventId == eventId && a.Status == RsvpStatus.Waitlisted)
            .OrderBy(a => a.RespondedAtUtc);

        List<EventAttendee> promoted;
        if (e.Capacity is { } capacity)
        {
            var going = await db.EventAttendees.CountAsync(
                a => a.EventId == eventId && a.Status == RsvpStatus.Going, cancellationToken);
            var free = capacity - going;
            if (free <= 0) return 0;
            promoted = await waitlist.Take(free).ToListAsync(cancellationToken);
        }
        else
        {
            // Capacity was removed: everyone on the waitlist gets in.
            promoted = await waitlist.ToListAsync(cancellationToken);
        }

        if (promoted.Count == 0) return 0;

        var now = DateTime.UtcNow;
        foreach (var attendee in promoted)
        {
            attendee.Status = RsvpStatus.Going;
            attendee.RespondedAtUtc = now;
        }
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Promoted {Count} user(s) from the waitlist of event {EventId}", promoted.Count, eventId);

        foreach (var attendee in promoted)
        {
            if (string.IsNullOrEmpty(attendee.User.Email)) continue;
            try
            {
                await emailSender.SendAsync(
                    attendee.User.Email,
                    attendee.User.DisplayName,
                    $"S-a eliberat un loc: {e.Title}",
                    BuildPromotedEmail(attendee.User, e),
                    cancellationToken);
            }
            catch (Exception ex)
            {
                // The promotion is already saved; a mail failure must not undo it or fail the request.
                logger.LogWarning(ex, "Could not send waitlist email to {Email}", attendee.User.Email);
            }
        }

        return promoted.Count;
    }

    private string BuildPromotedEmail(ApplicationUser user, Event e)
    {
        var link = $"{emailOptions.Value.FrontendBaseUrl.TrimEnd('/')}/events/{e.Id}";
        var name = WebUtility.HtmlEncode(user.DisplayName);
        var title = WebUtility.HtmlEncode(e.Title);
        var venue = WebUtility.HtmlEncode(e.VenueName);
        var when = EmailFormatting.LongDate(e.StartUtc);

        return $"""
            <div style="font-family:Arial,sans-serif;font-size:15px;color:#222;max-width:560px">
              <p>Salut, {name}!</p>
              <p>S-a eliberat un loc la <b>{title}</b> și tu erai primul pe lista de așteptare,
                 așa că participarea ta a fost confirmată automat.</p>
              <p>Când: {when}<br>Unde: {venue}</p>
              <p><a href="{link}">Vezi evenimentul</a></p>
              <p style="color:#777;font-size:13px">Dacă nu mai poți ajunge, anulează participarea de pe pagina
                 evenimentului, ca locul să ajungă la următoarea persoană de pe listă.</p>
              <hr>
              <p style="color:#555">Hi {name}! A spot opened up at <b>{title}</b> and you were first on the waitlist,
                 so you're now going. <a href="{link}">Open the event</a>.</p>
            </div>
            """;
    }
}
