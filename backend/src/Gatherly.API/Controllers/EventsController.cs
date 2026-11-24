using FluentValidation;
using Gatherly.API.Extensions;
using Gatherly.Application.Events;
using Gatherly.Application.Notifications;
using Gatherly.Domain.Entities;
using Gatherly.Domain.Enums;
using Gatherly.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gatherly.API.Controllers;

[ApiController]
[Route("api/events")]
public class EventsController(ApplicationDbContext db, IWaitlistService waitlist, IRsvpNotifier rsvpNotifier) : ControllerBase
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
                e.ExternalSource, e.Latitude, e.Longitude))
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
            .Include(x => x.Reviews)
            .AsSplitQuery()
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
                e.ExternalSource, e.Latitude, e.Longitude))
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
                a.Event.ExternalSource, a.Event.Latitude, a.Event.Longitude))
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
                f.Event.ExternalSource, f.Event.Latitude, f.Event.Longitude))
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// "For you": upcoming events the caller hasn't answered yet, ranked by the categories they showed interest in
    /// (RSVPs, favorites, reviews). With no history it falls back to the most popular upcoming events.
    /// </summary>
    [HttpGet("recommended")]
    [Authorize]
    public async Task<ActionResult<RecommendationsDto>> GetRecommended(
        [FromQuery] int limit = 8, CancellationToken cancellationToken = default)
    {
        var userId = User.GetUserId()!;
        limit = Math.Clamp(limit, 1, 24);

        var rsvpSignals = await db.EventAttendees.AsNoTracking()
            .Where(a => a.UserId == userId && a.Status != RsvpStatus.NotGoing)
            .Select(a => new { a.Event.Category, a.Status })
            .ToListAsync(cancellationToken);
        var favoriteCategories = await db.Favorites.AsNoTracking()
            .Where(f => f.UserId == userId)
            .Select(f => f.Event.Category)
            .ToListAsync(cancellationToken);
        var reviewSignals = await db.Reviews.AsNoTracking()
            .Where(r => r.UserId == userId)
            .Select(r => new { r.Event.Category, r.Rating })
            .ToListAsync(cancellationToken);

        var signals = rsvpSignals
            .Select(s => (s.Category, s.Status switch
            {
                RsvpStatus.Going => TasteSignal.Going,
                RsvpStatus.Waitlisted => TasteSignal.Waitlisted,
                _ => TasteSignal.Interested,
            }))
            .Concat(favoriteCategories.Select(c => (c, TasteSignal.Favorite)))
            .Concat(reviewSignals
                .Where(r => r.Rating >= 4 || r.Rating <= 2)
                .Select(r => (r.Category, r.Rating >= 4 ? TasteSignal.LikedReview : TasteSignal.DislikedReview)));
        var scores = RecommendationScorer.CategoryScores(signals);

        var now = DateTime.UtcNow;
        var candidates = await db.Events.AsNoTracking()
            .Where(e => e.StartUtc > now
                && e.OrganizerId != userId
                && !e.Attendees.Any(a => a.UserId == userId)
                && !e.FavoritedBy.Any(f => f.UserId == userId))
            .OrderBy(e => e.StartUtc)
            .Take(300)
            .Select(e => new EventSummaryDto(
                e.Id, e.Title, e.Category, e.StartUtc, e.EndUtc,
                e.VenueName, e.ImageUrl, e.Price,
                e.Attendees.Count(a => a.Status == RsvpStatus.Going),
                e.ExternalSource, e.Latitude, e.Longitude))
            .ToListAsync(cancellationToken);

        return new RecommendationsDto(
            RecommendationScorer.Rank(candidates, scores, limit),
            RecommendationScorer.TopCategories(scores));
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

        var newStartUtc = request.StartUtc.ToUniversalTime();
        if (newStartUtc != e.StartUtc)
        {
            // Rescheduled: everyone should get a fresh "starts soon" reminder for the new date.
            await db.EventAttendees
                .Where(a => a.EventId == id && a.ReminderSentAtUtc != null)
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.ReminderSentAtUtc, (DateTime?)null), cancellationToken);
        }

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

        // A bigger (or removed) capacity frees spots for people on the waitlist.
        await waitlist.PromoteAsync(id, cancellationToken);

        await db.Entry(e).Collection(x => x.Attendees).LoadAsync(cancellationToken);
        await db.Entry(e).Collection(x => x.FavoritedBy).LoadAsync(cancellationToken);
        await db.Entry(e).Collection(x => x.Reviews).LoadAsync(cancellationToken);
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

    /// <summary>
    /// Sets the caller's RSVP. Asking for Going on a full event puts the caller on the waitlist instead;
    /// the response says which status was stored. When a Going spot is given up, the waitlist moves up.
    /// </summary>
    [HttpPost("{id:guid}/rsvp")]
    [Authorize]
    public async Task<ActionResult<RsvpResponse>> Rsvp(Guid id, RsvpRequest request, CancellationToken cancellationToken)
    {
        if (!Enum.IsDefined(request.Status))
            return BadRequest(new { error = "Unknown RSVP status." });
        if (request.Status == RsvpStatus.Waitlisted)
            return BadRequest(new { error = "Ask for Going: you are added to the waitlist automatically when the event is full." });

        var userId = User.GetUserId()!;
        var e = await db.Events.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (e is null) return NotFound();
        if (e.EndUtc < DateTime.UtcNow) return BadRequest(new { error = "This event has already ended." });

        var existing = await db.EventAttendees
            .FirstOrDefaultAsync(a => a.EventId == id && a.UserId == userId, cancellationToken);
        var wasGoing = existing?.Status == RsvpStatus.Going;

        var status = request.Status;
        if (status == RsvpStatus.Going && !wasGoing && e.Capacity is { } capacity)
        {
            var going = await db.EventAttendees.CountAsync(
                a => a.EventId == id && a.Status == RsvpStatus.Going, cancellationToken);
            if (going >= capacity) status = RsvpStatus.Waitlisted;
        }

        var now = DateTime.UtcNow;
        var changed = existing is null || existing.Status != status;
        if (existing is null)
        {
            existing = new EventAttendee { EventId = id, UserId = userId, Status = status, RespondedAtUtc = now };
            db.EventAttendees.Add(existing);
        }
        else if (changed)
        {
            existing.Status = status;
            existing.RespondedAtUtc = now;
        }
        // Same status again: keep the timestamp so a waitlisted user doesn't lose their place.

        await db.SaveChangesAsync(cancellationToken);

        if (wasGoing && status != RsvpStatus.Going)
            await waitlist.PromoteAsync(id, cancellationToken);

        int? position = status == RsvpStatus.Waitlisted
            ? await db.EventAttendees.CountAsync(a => a.EventId == id
                && a.Status == RsvpStatus.Waitlisted
                && a.RespondedAtUtc <= existing.RespondedAtUtc, cancellationToken)
            : null;

        // Confirmation ("you're going, we'll remind you") or waitlist email, only when the answer actually changed.
        if (changed)
            await rsvpNotifier.NotifyAsync(id, userId, status, position, cancellationToken);

        return new RsvpResponse(status, position);
    }

    [HttpDelete("{id:guid}/rsvp")]
    [Authorize]
    public async Task<IActionResult> RemoveRsvp(Guid id, CancellationToken cancellationToken)
    {
        var rsvp = await db.EventAttendees
            .FirstOrDefaultAsync(a => a.EventId == id && a.UserId == User.GetUserId(), cancellationToken);
        if (rsvp is null) return NotFound();

        var wasGoing = rsvp.Status == RsvpStatus.Going;
        db.EventAttendees.Remove(rsvp);
        await db.SaveChangesAsync(cancellationToken);

        if (wasGoing)
            await waitlist.PromoteAsync(id, cancellationToken);

        return NoContent();
    }

    /// <summary>Everyone who answered the RSVP, for the event's organizer only.</summary>
    [HttpGet("{id:guid}/attendees")]
    [Authorize]
    public async Task<ActionResult<List<AttendeeDto>>> GetAttendees(Guid id, CancellationToken cancellationToken)
    {
        var organizerId = await db.Events.Where(e => e.Id == id).Select(e => e.OrganizerId).FirstOrDefaultAsync(cancellationToken);
        if (organizerId is null && !await db.Events.AnyAsync(e => e.Id == id, cancellationToken)) return NotFound();
        if (organizerId != User.GetUserId()) return Forbid();

        var attendees = await db.EventAttendees.AsNoTracking()
            .Where(a => a.EventId == id)
            .Select(a => new AttendeeDto(a.UserId, a.User.DisplayName, a.Status, a.RespondedAtUtc))
            .ToListAsync(cancellationToken);

        // Going first, then the waitlist in queue order, then the rest.
        int Rank(RsvpStatus s) => s switch
        {
            RsvpStatus.Going => 0,
            RsvpStatus.Waitlisted => 1,
            RsvpStatus.Interested => 2,
            _ => 3,
        };
        return attendees.OrderBy(a => Rank(a.Status)).ThenBy(a => a.RespondedAtUtc).ToList();
    }

    [HttpGet("{id:guid}/reviews")]
    public async Task<ActionResult<List<ReviewDto>>> GetReviews(Guid id, CancellationToken cancellationToken)
    {
        if (!await db.Events.AnyAsync(e => e.Id == id, cancellationToken)) return NotFound();

        return await db.Reviews.AsNoTracking()
            .Where(r => r.EventId == id)
            .OrderByDescending(r => r.CreatedAtUtc)
            .Select(r => new ReviewDto(r.Id, r.UserId, r.User.DisplayName, r.Rating, r.Comment, r.CreatedAtUtc, r.UpdatedAtUtc))
            .ToListAsync(cancellationToken);
    }

    /// <summary>Creates or updates the caller's review. Only people who were going can review, after the event ended.</summary>
    [HttpPut("{id:guid}/reviews")]
    [Authorize]
    public async Task<ActionResult<ReviewDto>> UpsertReview(
        Guid id,
        ReviewRequest request,
        [FromServices] IValidator<ReviewRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
            return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));

        var userId = User.GetUserId()!;
        var e = await db.Events.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (e is null) return NotFound();
        if (e.OrganizerId == userId) return BadRequest(new { error = "You can't review your own event." });
        if (e.EndUtc >= DateTime.UtcNow) return BadRequest(new { error = "You can review an event after it ends." });

        var attended = await db.EventAttendees.AnyAsync(
            a => a.EventId == id && a.UserId == userId && a.Status == RsvpStatus.Going, cancellationToken);
        if (!attended) return BadRequest(new { error = "Only people who were going can review this event." });

        var review = await db.Reviews.Include(r => r.User)
            .FirstOrDefaultAsync(r => r.EventId == id && r.UserId == userId, cancellationToken);
        var now = DateTime.UtcNow;
        if (review is null)
        {
            review = new Review { Id = Guid.NewGuid(), EventId = id, UserId = userId, CreatedAtUtc = now };
            db.Reviews.Add(review);
        }
        review.Rating = request.Rating;
        review.Comment = request.Comment?.Trim() ?? string.Empty;
        review.UpdatedAtUtc = now;

        await db.SaveChangesAsync(cancellationToken);
        await db.Entry(review).Reference(r => r.User).LoadAsync(cancellationToken);

        return new ReviewDto(review.Id, review.UserId, review.User.DisplayName, review.Rating, review.Comment,
            review.CreatedAtUtc, review.UpdatedAtUtc);
    }

    [HttpDelete("{id:guid}/reviews")]
    [Authorize]
    public async Task<IActionResult> DeleteReview(Guid id, CancellationToken cancellationToken)
    {
        var review = await db.Reviews
            .FirstOrDefaultAsync(r => r.EventId == id && r.UserId == User.GetUserId(), cancellationToken);
        if (review is null) return NotFound();

        db.Reviews.Remove(review);
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

    private static EventDetailDto ToDetail(Event e, string? userId)
    {
        var mine = userId is null ? null : e.Attendees.FirstOrDefault(a => a.UserId == userId);
        int? waitlistPosition = mine?.Status == RsvpStatus.Waitlisted
            ? e.Attendees.Count(a => a.Status == RsvpStatus.Waitlisted && a.RespondedAtUtc <= mine.RespondedAtUtc)
            : null;

        return new(
            e.Id, e.Title, e.Description, e.Category, e.StartUtc, e.EndUtc,
            e.VenueName, e.Address, e.Latitude, e.Longitude, e.Price, e.Capacity,
            e.ImageUrl, e.OrganizerId, e.Organizer?.DisplayName,
            e.Attendees.Count(a => a.Status == RsvpStatus.Going),
            e.Attendees.Count(a => a.Status == RsvpStatus.Interested),
            e.Attendees.Count(a => a.Status == RsvpStatus.Waitlisted),
            mine?.Status,
            waitlistPosition,
            userId is not null && e.FavoritedBy.Any(f => f.UserId == userId),
            e.Reviews.Count > 0 ? Math.Round(e.Reviews.Average(r => r.Rating), 1) : null,
            e.Reviews.Count,
            e.ExternalSource, e.ExternalUrl);
    }
}
