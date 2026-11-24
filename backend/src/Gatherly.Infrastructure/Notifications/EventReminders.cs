using Gatherly.Application.Notifications;
using Gatherly.Domain.Entities;
using Gatherly.Domain.Enums;
using Gatherly.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Gatherly.Infrastructure.Notifications;

public class ReminderOptions
{
    public const string SectionName = "Reminders";

    public bool Enabled { get; set; } = true;
    /// <summary>How often to look for events that need a reminder.</summary>
    public double IntervalMinutes { get; set; } = 5;
    /// <summary>Send the reminder when the event starts within this many hours.</summary>
    public double LeadHours { get; set; } = 24;
}

/// <summary>
/// One pass of the reminder job: emails everyone who is Going to an event starting within
/// <see cref="ReminderOptions.LeadHours"/> and hasn't been reminded yet. Failed emails are retried on the next pass.
/// </summary>
public class EventReminderDispatcher(
    ApplicationDbContext db,
    IEmailSender emailSender,
    IOptions<EmailOptions> emailOptions,
    IOptions<ReminderOptions> reminderOptions,
    ILogger<EventReminderDispatcher> logger)
{
    public async Task<int> SendDueAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var until = now.AddHours(reminderOptions.Value.LeadHours);

        var due = await db.EventAttendees
            .Include(a => a.User)
            .Include(a => a.Event)
            .Where(a => a.Status == RsvpStatus.Going
                && a.ReminderSentAtUtc == null
                && a.Event.StartUtc > now
                && a.Event.StartUtc <= until)
            .ToListAsync(cancellationToken);

        var sent = 0;
        foreach (var attendee in due)
        {
            if (string.IsNullOrEmpty(attendee.User.Email)) continue;
            try
            {
                var e = attendee.Event;
                await emailSender.SendAsync(
                    attendee.User.Email,
                    attendee.User.DisplayName,
                    $"{EmailFormatting.RelativeDay(e.StartUtc, now)} la {EmailFormatting.Time(e.StartUtc)}: {e.Title}",
                    BuildBody(attendee.User, e, now),
                    cancellationToken);
                attendee.ReminderSentAtUtc = DateTime.UtcNow;
                sent++;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Could not send reminder to {Email} for event {EventId}", attendee.User.Email, attendee.EventId);
            }
        }

        if (sent > 0)
        {
            await db.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Sent {Count} event reminder(s)", sent);
        }
        return sent;
    }

    private string BuildBody(ApplicationUser user, Event e, DateTime now)
    {
        var link = EmailFormatting.EventLink(emailOptions.Value.FrontendBaseUrl, e.Id);
        var maps = e.Latitude is { } lat && e.Longitude is { } lng
            ? $"https://www.google.com/maps/search/?api=1&query={lat.ToString(System.Globalization.CultureInfo.InvariantCulture)},{lng.ToString(System.Globalization.CultureInfo.InvariantCulture)}"
            : $"https://www.google.com/maps/search/?api=1&query={Uri.EscapeDataString($"{e.VenueName}, {e.Address}")}";

        return EmailFormatting.Layout($"""
            <p>Salut, {EmailFormatting.Encode(user.DisplayName)}!</p>
            <p>Îți amintim că <b>{EmailFormatting.Encode(e.Title)}</b> începe
               <b>{EmailFormatting.RelativeDay(e.StartUtc, now).ToLowerInvariant()} la {EmailFormatting.Time(e.StartUtc)}</b>.</p>
            <p>Când: {EmailFormatting.LongDate(e.StartUtc)}<br>
               Unde: {EmailFormatting.Encode(e.VenueName)}, {EmailFormatting.Encode(e.Address)}</p>
            <p><a href="{link}">Vezi evenimentul</a> · <a href="{maps}">Indicații de drum</a></p>
            <p style="color:#777;font-size:13px">Nu mai poți ajunge? Anulează participarea pe pagina evenimentului,
               ca locul tău să ajungă la cineva de pe lista de așteptare.</p>
            """);
    }
}

/// <summary>Runs <see cref="EventReminderDispatcher"/> every few minutes for as long as the API is up.</summary>
public class EventReminderService(
    IServiceScopeFactory scopeFactory,
    IOptions<ReminderOptions> options,
    ILogger<EventReminderService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var opts = options.Value;
        if (!opts.Enabled)
        {
            logger.LogInformation("Event reminders are disabled");
            return;
        }

        logger.LogInformation("Event reminders: checking every {Interval} min for events starting within {Lead} h",
            opts.IntervalMinutes, opts.LeadHours);

        // Give startup (migrations, seeding) a moment before the first pass.
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(opts.IntervalMinutes));
        do
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                await scope.ServiceProvider.GetRequiredService<EventReminderDispatcher>().SendDueAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Event reminder pass failed");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
