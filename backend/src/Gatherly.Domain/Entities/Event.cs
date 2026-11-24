using Gatherly.Domain.Enums;

namespace Gatherly.Domain.Entities;

public class Event
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public EventCategory Category { get; set; }
    public DateTime StartUtc { get; set; }
    public DateTime EndUtc { get; set; }
    public string VenueName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public decimal? Price { get; set; }
    public int? Capacity { get; set; }
    public string? ImageUrl { get; set; }
    public string? OrganizerId { get; set; }
    public ApplicationUser? Organizer { get; set; }
    public string? ExternalSource { get; set; }
    public string? ExternalId { get; set; }
    public string? ExternalUrl { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<EventAttendee> Attendees { get; set; } = new List<EventAttendee>();
    public ICollection<Favorite> FavoritedBy { get; set; } = new List<Favorite>();
}
