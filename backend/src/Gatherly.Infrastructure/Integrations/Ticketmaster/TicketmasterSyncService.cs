using System.Net.Http.Json;
using Gatherly.Application.Integrations;
using Gatherly.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Gatherly.Infrastructure.Integrations.Ticketmaster;

public class TicketmasterSyncService(
    HttpClient httpClient,
    ApplicationDbContext db,
    IOptions<TicketmasterOptions> options,
    ILogger<TicketmasterSyncService> logger) : ITicketmasterSyncService
{
    private const string Source = "ticketmaster";
    private readonly TicketmasterOptions _options = options.Value;

    public async Task<EventSyncResult> SyncAsync(CancellationToken cancellationToken = default)
    {
        var fetched = 0;
        var created = 0;
        var updated = 0;
        var skipped = 0;

        for (var page = 0; page < _options.MaxPages; page++)
        {
            var url = $"events.json?apikey={_options.ApiKey}" +
                      $"&city={Uri.EscapeDataString(_options.City)}" +
                      $"&countryCode={_options.CountryCode}" +
                      $"&size={_options.PageSize}&page={page}&sort=date,asc";

            var response = await httpClient.GetFromJsonAsync<TmEventSearchResponse>(url, cancellationToken);
            var events = response?.Embedded?.Events ?? [];
            fetched += events.Count;

            if (events.Count == 0)
                break;

            var externalIds = events.Select(e => e.Id).ToList();
            var existing = await db.Events
                .Where(e => e.ExternalSource == Source && externalIds.Contains(e.ExternalId!))
                .ToDictionaryAsync(e => e.ExternalId!, cancellationToken);

            foreach (var tm in events)
            {
                if (TicketmasterEventMapper.MapToEvent(tm, Source) is not { } mapped)
                {
                    skipped++;
                    continue;
                }

                if (existing.TryGetValue(tm.Id, out var current))
                {
                    current.Title = mapped.Title;
                    current.Description = mapped.Description;
                    current.Category = mapped.Category;
                    current.StartUtc = mapped.StartUtc;
                    current.EndUtc = mapped.EndUtc;
                    current.VenueName = mapped.VenueName;
                    current.Address = mapped.Address;
                    current.Latitude = mapped.Latitude;
                    current.Longitude = mapped.Longitude;
                    current.Price = mapped.Price;
                    current.ImageUrl = mapped.ImageUrl;
                    current.ExternalUrl = mapped.ExternalUrl;
                    current.UpdatedAtUtc = DateTime.UtcNow;
                    updated++;
                }
                else
                {
                    db.Events.Add(mapped);
                    created++;
                }
            }

            await db.SaveChangesAsync(cancellationToken);

            if (response?.Page is null || page + 1 >= response.Page.TotalPages)
                break;
        }

        logger.LogInformation("Ticketmaster sync: {Fetched} fetched, {Created} created, {Updated} updated, {Skipped} skipped",
            fetched, created, updated, skipped);

        return new EventSyncResult(fetched, created, updated, skipped);
    }
}
