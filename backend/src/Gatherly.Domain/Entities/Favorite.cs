namespace Gatherly.Domain.Entities;

public class Favorite
{
    public Guid EventId { get; set; }
    public Event Event { get; set; } = null!;
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
