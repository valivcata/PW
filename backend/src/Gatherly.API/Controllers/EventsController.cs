using FluentValidation;
using Gatherly.API.Extensions;
using Gatherly.Application.Events;
using Gatherly.Domain.Entities;
using Gatherly.Domain.Enums;
using Gatherly.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gatherly.API.Controllers;

[ApiController]
[Route("api/events")]
public class EventsController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<EventSummaryDto>>> GetEvents(
        [FromQuery] EventQuery query, CancellationToken cancellationToken)
    {
        var events = db.Events.AsNoTracking().Where(e => e.EndUtc >= DateTime.UtcNow);

        if (query.Category is { } category)
            events = events.Where(e => e.Category == category);
        if (query.From is { } from)
            events = events.Where(e => e.StartUtc >= from);
        if (query.To is { } to)
            events = events.Where(e => e.StartUtc <= to);
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = $"%{query.Search.Trim()}%";
            events = events.Where(e =>
                EF.Functions.ILike(e.Title, term) ||
                EF.Functions.ILike(e.Description, term) ||
                EF.Functions.ILike(e.VenueName, term));
        }
        if (query is { Latitude: { } lat, Longitude: { } lng, RadiusKm: { } radius })
        {
            // ~0.009 deg latitude per km; longitude scaled by cos(lat)
            var latDelta = radius * 0.009;
            var lngDelta = radius * 0.009 / Math.Cos(lat * Math.PI / 180);
            events = events.Where(e =>
                e.Latitude >= lat - latDelta && e.Latitude <= lat + latDelta &&
                e.Longitude >= lng - lngDelta && e.Longitude <= lng + lngDelta);
        }

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var total = await events.CountAsync(cancellationToken);
        var items = await events
            .OrderBy(e => e.StartUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new EventSummaryDto(
                e.Id, e.Title, e.Category, e.StartUtc, e.EndUtc,
                e.VenueName, e.ImageUrl, e.Price,
                e.Attendees.Count(a => a.Status == RsvpStatus.Going),
                e.ExternalSource))
            .ToListAsync(cancellationToken);

        return new PagedResult<EventSummaryDto>(items, total, page, pageSize);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EventDetailDto>> GetEvent(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var e = await db.Events.AsNoTracking()
            .Include(x => x.Organizer)
            .Include(x => x.Attendees)
            .Include(x => x.FavoritedBy)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (e is null) return NotFound();

        return ToDetail(e, userId);
    }

    [HttpGet("mine")]
    [Authorize]
    public async Task<ActionResult<List<EventSummaryDto>>> GetMine(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId()!;
        return await db.Events.AsNoTracking()
            .Where(e => e.OrganizerId == userId)
            .OrderBy(e => e.StartUtc)
            .Select(e => new EventSummaryDto(
                e.Id, e.Title, e.Category, e.StartUtc, e.EndUtc,
                e.VenueName, e.ImageUrl, e.Price,
                e.Attendees.Count(a => a.Status == RsvpStatus.Going),
                e.ExternalSource))
            .ToListAsync(cancellationToken);
    }

    [HttpGet("attending")]
    [Authorize]
    public async Task<ActionResult<List<EventSummaryDto>>> GetAttending(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId()!;
        return await db.EventAttendees.AsNoTracking()
            .Where(a => a.UserId == userId && a.Status != RsvpStatus.NotGoing && a.Event.EndUtc >= DateTime.UtcNow)
            .OrderBy(a => a.Event.StartUtc)
            .Select(a => new EventSummaryDto(
                a.Event.Id, a.Event.Title, a.Event.Category, a.Event.StartUtc, a.Event.EndUtc,
                a.Event.VenueName, a.Event.ImageUrl, a.Event.Price,
                a.Event.Attendees.Count(x => x.Status == RsvpStatus.Going),
                a.Event.ExternalSource))
            .ToListAsync(cancellationToken);
    }

    [HttpGet("favorites")]
    [Authorize]
    public async Task<ActionResult<List<EventSummaryDto>>> GetFavorites(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId()!;
        return await db.Favorites.AsNoTracking()
            .Where(f => f.UserId == userId)
            .OrderBy(f => f.Event.StartUtc)
            .Select(f => new EventSummaryDto(
                f.Event.Id, f.Event.Title, f.Event.Category, f.Event.StartUtc, f.Event.EndUtc,
                f.Event.VenueName, f.Event.ImageUrl, f.Event.Price,
                f.Event.Attendees.Count(x => x.Status == RsvpStatus.Going),
                f.Event.ExternalSource))
            .ToListAsync(cancellationToken);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<EventDetailDto>> CreateEvent(
        CreateEventRequest request,
        [FromServices] IValidator<CreateEventRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
            return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));

        var userId = User.GetUserId()!;
        var e = new Event
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            Category = request.Category,
            StartUtc = request.StartUtc.ToUniversalTime(),
            EndUtc = request.EndUtc.ToUniversalTime(),
            VenueName = request.VenueName,
            Address = request.Address,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Price = request.Price,
            Capacity = request.Capacity,
            ImageUrl = request.ImageUrl,
            OrganizerId = userId,
        };

        db.Events.Add(e);
        await db.SaveChangesAsync(cancellationToken);
        await db.Entry(e).Reference(x => x.Organizer).LoadAsync(cancellationToken);

        return CreatedAtAction(nameof(GetEvent), new { id = e.Id }, ToDetail(e, userId));
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<EventDetailDto>> UpdateEvent(
        Guid id,
        UpdateEventRequest request,
        [FromServices] IValidator<UpdateEventRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
            return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));

        var userId = User.GetUserId()!;
        var e = await db.Events.Include(x => x.Organizer)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (e is null) return NotFound();
        if (e.OrganizerId != userId) return Forbid();

        e.Title = request.Title;
        e.Description = request.Description;
        e.Category = request.Category;
        e.StartUtc = request.StartUtc.ToUniversalTime();
        e.EndUtc = request.EndUtc.ToUniversalTime();
        e.VenueName = request.VenueName;
        e.Address = request.Address;
        e.Latitude = request.Latitude;
        e.Longitude = request.Longitude;
        e.Price = request.Price;
        e.Capacity = request.Capacity;
        e.ImageUrl = request.ImageUrl;
        e.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        return ToDetail(e, userId);
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteEvent(Guid id, CancellationToken cancellationToken)
    {
        var e = await db.Events.FindAsync([id], cancellationToken);
        if (e is null) return NotFound();
        if (e.OrganizerId != User.GetUserId()) return Forbid();

        db.Events.Remove(e);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/rsvp")]
    [Authorize]
    public async Task<IActionResult> Rsvp(Guid id, RsvpRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId()!;
        var e = await db.Events
            .Include(x => x.Attendees.Where(a => a.Status == RsvpStatus.Going))
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (e is null) return NotFound();

        if (request.Status == RsvpStatus.Going
            && e.Capacity is { } capacity
            && e.Attendees.Count(a => a.UserId != userId) >= capacity
            && e.Attendees.All(a => a.UserId != userId))
            return Conflict(new { error = "Event is at full capacity." });

        var existing = await db.EventAttendees
            .FirstOrDefaultAsync(a => a.EventId == id && a.UserId == userId, cancellationToken);

        if (existing is null)
        {
            db.EventAttendees.Add(new EventAttendee
            {
                EventId = id,
                UserId = userId,
                Status = request.Status,
            });
        }
        else
        {
            existing.Status = request.Status;
            existing.RespondedAtUtc = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}/rsvp")]
    [Authorize]
    public async Task<IActionResult> RemoveRsvp(Guid id, CancellationToken cancellationToken)
    {
        var rsvp = await db.EventAttendees
            .FirstOrDefaultAsync(a => a.EventId == id && a.UserId == User.GetUserId(), cancellationToken);
        if (rsvp is null) return NotFound();

        db.EventAttendees.Remove(rsvp);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/favorite")]
    [Authorize]
    public async Task<IActionResult> Favorite(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId()!;
        if (!await db.Events.AnyAsync(e => e.Id == id, cancellationToken))
            return NotFound();

        if (!await db.Favorites.AnyAsync(f => f.EventId == id && f.UserId == userId, cancellationToken))
        {
            db.Favorites.Add(new Favorite { EventId = id, UserId = userId });
            await db.SaveChangesAsync(cancellationToken);
        }
        return NoContent();
    }

    [HttpDelete("{id:guid}/favorite")]
    [Authorize]
    public async Task<IActionResult> Unfavorite(Guid id, CancellationToken cancellationToken)
    {
        var favorite = await db.Favorites
            .FirstOrDefaultAsync(f => f.EventId == id && f.UserId == User.GetUserId(), cancellationToken);
        if (favorite is null) return NotFound();

        db.Favorites.Remove(favorite);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static EventDetailDto ToDetail(Event e, string? userId) => new(
        e.Id, e.Title, e.Description, e.Category, e.StartUtc, e.EndUtc,
        e.VenueName, e.Address, e.Latitude, e.Longitude, e.Price, e.Capacity,
        e.ImageUrl, e.OrganizerId, e.Organizer?.DisplayName,
        e.Attendees.Count(a => a.Status == RsvpStatus.Going),
        e.Attendees.Count(a => a.Status == RsvpStatus.Interested),
        e.Attendees.FirstOrDefault(a => a.UserId == userId)?.Status,
        userId is not null && e.FavoritedBy.Any(f => f.UserId == userId),
        e.ExternalSource, e.ExternalUrl);
}
