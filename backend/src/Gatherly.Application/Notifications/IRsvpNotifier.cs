using Gatherly.Domain.Enums;

namespace Gatherly.Application.Notifications;

public interface IRsvpNotifier
{
    /// <summary>
    /// Emails the user after their RSVP changed: a confirmation (with the reminder promise) for Going,
    /// or their place in line for Waitlisted. Other statuses send nothing. Never throws.
    /// </summary>
    Task NotifyAsync(Guid eventId, string userId, RsvpStatus status, int? waitlistPosition, CancellationToken cancellationToken = default);
}
