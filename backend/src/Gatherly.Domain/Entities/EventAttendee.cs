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
}
