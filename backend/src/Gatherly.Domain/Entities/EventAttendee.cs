using Gatherly.Domain.Enums;

namespace Gatherly.Domain.Entities;

public class EventAttendee
{
    public Guid EventId { get; set; }
    public Event Event { get; set; } = null!;
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public RsvpStatus Status { get; set; }
    public DateTime RespondedAtUtc { get; set; } = DateTime.UtcNow;
    /// <summary>When the "starts soon" reminder email went out; null = not sent yet. Reset when the event is rescheduled.</summary>
    public DateTime? ReminderSentAtUtc { get; set; }
}
