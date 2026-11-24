namespace Gatherly.Domain.Entities;

/// <summary>A rating (1-5) and comment left by someone who attended an event after it ended.</summary>
public class Review
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public Event Event { get; set; } = null!;
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
