using Gatherly.Application.Events;

namespace Gatherly.UnitTests.Events;

public class ReviewRequestValidatorTests
{
    private readonly ReviewRequestValidator _validator = new();

    [Theory]
    [InlineData(1)]
    [InlineData(5)]
    public void Rating_between_1_and_5_passes(int rating)
    {
        Assert.True(_validator.Validate(new ReviewRequest(rating, "Great night")).IsValid);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    public void Rating_out_of_range_fails(int rating)
    {
        var result = _validator.Validate(new ReviewRequest(rating, null));
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Rating");
    }

    [Fact]
    public void Comment_is_optional()
    {
        Assert.True(_validator.Validate(new ReviewRequest(4, null)).IsValid);
    }

    [Fact]
    public void Too_long_comment_fails()
    {
        var result = _validator.Validate(new ReviewRequest(4, new string('a', 2001)));
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Comment");
    }
}
