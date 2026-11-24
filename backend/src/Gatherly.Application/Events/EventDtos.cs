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
    string? ExternalSource);

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
    RsvpStatus? MyRsvpStatus,
    bool IsFavorite,
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
