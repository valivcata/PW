using Microsoft.AspNetCore.Identity;

namespace Gatherly.Domain.Entities;

public class ApplicationUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<Event> OrganizedEvents { get; set; } = new List<Event>();
    public ICollection<EventAttendee> Rsvps { get; set; } = new List<EventAttendee>();
    public ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
}
