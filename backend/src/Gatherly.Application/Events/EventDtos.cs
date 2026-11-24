using Gatherly.Domain.Enums;

namespace Gatherly.Application.Events;

public record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize);

public record EventSummaryDto(
    Guid Id,
    string Title,
    EventCategory Category,
    DateTime StartUtc,
    DateTime EndUtc,
    string VenueName,
    string? ImageUrl,
    decimal? Price,
    int GoingCount,
    string? ExternalSource,
    double? Latitude,
    double? Longitude);

public record EventDetailDto(
    Guid Id,
    string Title,
    string Description,
    EventCategory Category,
    DateTime StartUtc,
    DateTime EndUtc,
    string VenueName,
    string Address,
    double? Latitude,
    double? Longitude,
    decimal? Price,
    int? Capacity,
    string? ImageUrl,
    string? OrganizerId,
    string? OrganizerName,
    int GoingCount,
    int InterestedCount,
    int WaitlistCount,
    RsvpStatus? MyRsvpStatus,
    /// <summary>1-based place in the waitlist when MyRsvpStatus is Waitlisted, otherwise null.</summary>
    int? MyWaitlistPosition,
    bool IsFavorite,
    double? AverageRating,
    int ReviewCount,
    string? ExternalSource,
    string? ExternalUrl);

public record CreateEventRequest(
    string Title,
    string Description,
    EventCategory Category,
    DateTime StartUtc,
    DateTime EndUtc,
    string VenueName,
    string Address,
    double? Latitude,
    double? Longitude,
    decimal? Price,
    int? Capacity,
    string? ImageUrl);

public record UpdateEventRequest(
    string Title,
    string Description,
    EventCategory Category,
    DateTime StartUtc,
    DateTime EndUtc,
    string VenueName,
    string Address,
    double? Latitude,
    double? Longitude,
    decimal? Price,
    int? Capacity,
    string? ImageUrl);

public record EventQuery
{
    public EventCategory? Category { get; init; }
    public DateTime? From { get; init; }
    public DateTime? To { get; init; }
    public string? Search { get; init; }
    public double? Latitude { get; init; }
    public double? Longitude { get; init; }
    public double? RadiusKm { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}

public record RsvpRequest(RsvpStatus Status);

/// <summary>The status actually stored: asking for Going on a full event returns Waitlisted.</summary>
public record RsvpResponse(RsvpStatus Status, int? WaitlistPosition);

/// <summary>One RSVP as seen by the event's organizer.</summary>
public record AttendeeDto(
    string UserId,
    string DisplayName,
    RsvpStatus Status,
    DateTime RespondedAtUtc);

public record ReviewDto(
    Guid Id,
    string UserId,
    string UserDisplayName,
    int Rating,
    string Comment,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);

public record ReviewRequest(int Rating, string? Comment);
