using System.Globalization;
using Gatherly.Domain.Entities;
using Gatherly.Domain.Enums;

namespace Gatherly.Infrastructure.Integrations.Ticketmaster;

internal static class TicketmasterEventMapper
{
    public static Event? MapToEvent(TmEvent tm, string source)
    {
        var startUtc = ToUtc(tm.Dates?.Start);
        if (startUtc is null || string.IsNullOrWhiteSpace(tm.Name))
            return null;

        var venue = tm.Embedded?.Venues.FirstOrDefault();
        var description = string.Join("\n\n", new[] { tm.Info, tm.PleaseNote }.Where(s => !string.IsNullOrWhiteSpace(s)));

        return new Event
        {
            Id = Guid.NewGuid(),
            ExternalSource = source,
            ExternalId = tm.Id,
            ExternalUrl = tm.Url,
            Title = tm.Name.Length > 200 ? tm.Name[..200] : tm.Name,
            Description = string.IsNullOrWhiteSpace(description) ? tm.Name : description,
            Category = MapCategory(tm.Classifications),
            StartUtc = startUtc.Value,
            EndUtc = tm.Dates?.End?.DateTime?.ToUniversalTime() ?? startUtc.Value.AddHours(3),
            VenueName = venue?.Name ?? "TBA",
            Address = string.Join(", ", new[] { venue?.Address?.Line1, venue?.City?.Name }.Where(s => !string.IsNullOrWhiteSpace(s))),
            Latitude = ParseCoordinate(venue?.Location?.Latitude),
            Longitude = ParseCoordinate(venue?.Location?.Longitude),
            Price = tm.PriceRanges?.FirstOrDefault()?.Min,
            ImageUrl = BestImage(tm.Images),
        };
    }

    internal static DateTime? ToUtc(TmStart? start)
    {
        if (start?.DateTime is { } dt)
            return dt.ToUniversalTime();
        if (start?.LocalDate is { } localDate
            && DateTime.TryParseExact(
                $"{localDate} {start.LocalTime ?? "20:00:00"}",
                "yyyy-MM-dd HH:mm:ss",
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeLocal,
                out var local))
            return local.ToUniversalTime();
        return null;
    }

    private static double? ParseCoordinate(string? value) =>
        double.TryParse(value, CultureInfo.InvariantCulture, out var d) ? d : null;

    private static string? BestImage(List<TmImage>? images) =>
        images?.Where(i => !string.IsNullOrWhiteSpace(i.Url))
            .OrderByDescending(i => i.Width)
            .FirstOrDefault()?.Url;

    internal static EventCategory MapCategory(List<TmClassification>? classifications)
    {
        var primary = classifications?.FirstOrDefault(c => c.Primary) ?? classifications?.FirstOrDefault();
        var name = primary?.Segment?.Name ?? primary?.Genre?.Name;

        return name?.ToLowerInvariant() switch
        {
            "music" => EventCategory.Music,
            "sports" => EventCategory.Sports,
            "arts & theatre" or "arts" or "theatre" => EventCategory.Arts,
            "film" => EventCategory.Film,
            _ => EventCategory.Other
        };
    }
}
