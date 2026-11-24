using Gatherly.Domain.Enums;

namespace Gatherly.Application.Events;

/// <summary>Upcoming events picked for the user, plus the categories the pick is based on (empty = popular fallback).</summary>
public record RecommendationsDto(IReadOnlyList<EventSummaryDto> Items, IReadOnlyList<EventCategory> BasedOn);

/// <summary>Something the user did that says they like a category.</summary>
public enum TasteSignal
{
    Going,
    Interested,
    Waitlisted,
    Favorite,
    /// <summary>Review rated 4 or 5.</summary>
    LikedReview,
    /// <summary>Review rated 1 or 2.</summary>
    DislikedReview,
}

/// <summary>
/// Turns the user's history (RSVPs, favorites, reviews) into a score per category and ranks events by it.
/// Pure and stateless so it can be unit-tested without a database.
/// </summary>
public static class RecommendationScorer
{
    public static int Weight(TasteSignal signal) => signal switch
    {
        TasteSignal.Going => 3,
        TasteSignal.Waitlisted => 3,
        TasteSignal.LikedReview => 3,
        TasteSignal.Interested => 2,
        TasteSignal.Favorite => 2,
        TasteSignal.DislikedReview => -2,
        _ => 0,
    };

    /// <summary>Sum of signal weights per category; only categories that end up positive are kept.</summary>
    public static Dictionary<EventCategory, int> CategoryScores(IEnumerable<(EventCategory Category, TasteSignal Signal)> signals) =>
        signals
            .GroupBy(s => s.Category)
            .Select(g => (Category: g.Key, Score: g.Sum(s => Weight(s.Signal))))
            .Where(x => x.Score > 0)
            .ToDictionary(x => x.Category, x => x.Score);

    /// <summary>
    /// Orders candidates: liked categories first (higher score first), then more popular, then sooner.
    /// Other categories fill the remaining places, so with no history this is simply "most popular upcoming".
    /// </summary>
    public static List<EventSummaryDto> Rank(
        IEnumerable<EventSummaryDto> candidates,
        IReadOnlyDictionary<EventCategory, int> categoryScores,
        int limit) =>
        candidates
            .OrderByDescending(e => categoryScores.GetValueOrDefault(e.Category))
            .ThenByDescending(e => e.GoingCount)
            .ThenBy(e => e.StartUtc)
            .Take(limit)
            .ToList();

    /// <summary>Categories ordered by how much the user likes them (for the "because you like ..." label).</summary>
    public static List<EventCategory> TopCategories(IReadOnlyDictionary<EventCategory, int> categoryScores, int count = 3) =>
        categoryScores.OrderByDescending(kv => kv.Value).ThenBy(kv => kv.Key).Take(count).Select(kv => kv.Key).ToList();
}
