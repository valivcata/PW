using Gatherly.Application.Events;
using Gatherly.Domain.Enums;

namespace Gatherly.UnitTests.Events;

public class RecommendationScorerTests
{
    private static readonly DateTime Soon = new(2030, 1, 10, 18, 0, 0, DateTimeKind.Utc);

    private static EventSummaryDto Ev(string title, EventCategory category, int going = 0, int daysFromNow = 1) =>
        new(Guid.NewGuid(), title, category, Soon.AddDays(daysFromNow), Soon.AddDays(daysFromNow).AddHours(2),
            "Venue", null, null, going, null, null, null);

    [Fact]
    public void Scores_add_up_per_category_and_drop_non_positive()
    {
        var scores = RecommendationScorer.CategoryScores([
            (EventCategory.Tech, TasteSignal.Going),          // +3
            (EventCategory.Tech, TasteSignal.Favorite),       // +2
            (EventCategory.Music, TasteSignal.Interested),    // +2
            (EventCategory.Sports, TasteSignal.Going),        // +3
            (EventCategory.Sports, TasteSignal.DislikedReview), // -2 -> 1
            (EventCategory.Film, TasteSignal.DislikedReview), // -2 -> dropped
        ]);

        Assert.Equal(5, scores[EventCategory.Tech]);
        Assert.Equal(2, scores[EventCategory.Music]);
        Assert.Equal(1, scores[EventCategory.Sports]);
        Assert.False(scores.ContainsKey(EventCategory.Film));
    }

    [Fact]
    public void Liked_categories_come_first_then_popularity()
    {
        var scores = new Dictionary<EventCategory, int> { [EventCategory.Tech] = 5, [EventCategory.Music] = 2 };
        var ranked = RecommendationScorer.Rank([
            Ev("popular food", EventCategory.Food, going: 100),
            Ev("music", EventCategory.Music, going: 5),
            Ev("tech quiet", EventCategory.Tech, going: 1),
            Ev("tech busy", EventCategory.Tech, going: 40),
        ], scores, limit: 10);

        Assert.Equal(["tech busy", "tech quiet", "music", "popular food"], ranked.Select(e => e.Title));
    }

    [Fact]
    public void Without_history_it_is_most_popular_then_soonest()
    {
        var ranked = RecommendationScorer.Rank([
            Ev("later", EventCategory.Food, going: 10, daysFromNow: 5),
            Ev("sooner", EventCategory.Arts, going: 10, daysFromNow: 1),
            Ev("top", EventCategory.Film, going: 50),
        ], new Dictionary<EventCategory, int>(), limit: 2);

        Assert.Equal(["top", "sooner"], ranked.Select(e => e.Title));
    }

    [Fact]
    public void Top_categories_are_ordered_by_score()
    {
        var top = RecommendationScorer.TopCategories(new Dictionary<EventCategory, int>
        {
            [EventCategory.Music] = 2, [EventCategory.Tech] = 7, [EventCategory.Food] = 4, [EventCategory.Arts] = 1,
        });

        Assert.Equal([EventCategory.Tech, EventCategory.Food, EventCategory.Music], top);
    }
}
