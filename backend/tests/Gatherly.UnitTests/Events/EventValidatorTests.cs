using Gatherly.Application.Events;
using Gatherly.Domain.Enums;

namespace Gatherly.UnitTests.Events;

public class CreateEventRequestValidatorTests
{
    private readonly CreateEventRequestValidator _validator = new();

    private static CreateEventRequest Valid() => new(
        Title: "Jazz Night",
        Description: "Live jazz",
        Category: EventCategory.Music,
        StartUtc: DateTime.UtcNow.AddDays(2),
        EndUtc: DateTime.UtcNow.AddDays(2).AddHours(3),
        VenueName: "Vineri 15",
        Address: "Strada Emanoil Ungureanu 15",
        Latitude: 45.74,
        Longitude: 21.22,
        Price: 30m,
        Capacity: 80,
        ImageUrl: "https://example.com/img.jpg");

    [Fact]
    public void Valid_request_passes()
    {
        var result = _validator.Validate(Valid());
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Empty_title_fails(string title)
    {
        var result = _validator.Validate(Valid() with { Title = title });
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Title");
    }

    [Fact]
    public void Title_over_200_chars_fails()
    {
        var result = _validator.Validate(Valid() with { Title = new string('x', 201) });
        Assert.False(result.IsValid);
    }

    [Fact]
    public void End_before_start_fails()
    {
        var start = DateTime.UtcNow.AddDays(2);
        var result = _validator.Validate(Valid() with { StartUtc = start, EndUtc = start.AddHours(-1) });
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "EndUtc");
    }

    [Fact]
    public void Start_in_past_fails()
    {
        var result = _validator.Validate(Valid() with { StartUtc = DateTime.UtcNow.AddDays(-1) });
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "StartUtc");
    }

    [Fact]
    public void Zero_capacity_fails()
    {
        var result = _validator.Validate(Valid() with { Capacity = 0 });
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Null_capacity_and_price_pass()
    {
        var result = _validator.Validate(Valid() with { Capacity = null, Price = null });
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Negative_price_fails()
    {
        var result = _validator.Validate(Valid() with { Price = -5m });
        Assert.False(result.IsValid);
    }
}

public class UpdateEventRequestValidatorTests
{
    private readonly UpdateEventRequestValidator _validator = new();

    private static UpdateEventRequest Valid() => new(
        Title: "Updated",
        Description: "Desc",
        Category: EventCategory.Arts,
        StartUtc: DateTime.UtcNow.AddDays(-1), // past start allowed on update (editing ongoing events)
        EndUtc: DateTime.UtcNow.AddDays(1),
        VenueName: "Venue",
        Address: "Addr",
        Latitude: null,
        Longitude: null,
        Price: null,
        Capacity: null,
        ImageUrl: null);

    [Fact]
    public void Valid_request_passes()
    {
        Assert.True(_validator.Validate(Valid()).IsValid);
    }

    [Fact]
    public void End_before_start_fails()
    {
        var start = DateTime.UtcNow;
        var result = _validator.Validate(Valid() with { StartUtc = start, EndUtc = start.AddMinutes(-1) });
        Assert.False(result.IsValid);
    }
}
