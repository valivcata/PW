using Gatherly.Domain.Enums;
using Gatherly.Infrastructure.Integrations.Ticketmaster;

namespace Gatherly.UnitTests.Integrations;

public class TicketmasterEventMapperTests
{
    private static TmEvent FullTmEvent() => new()
    {
        Id = "tm-1",
        Name = "Concert Symphonic",
        Info = "A great show",
        Url = "https://ticketmaster.ro/event/tm-1",
        Dates = new TmDates
        {
            Start = new TmStart { DateTime = new DateTime(2026, 12, 5, 19, 0, 0, DateTimeKind.Utc) },
            End = new TmEnd { DateTime = new DateTime(2026, 12, 5, 22, 0, 0, DateTimeKind.Utc) },
        },
        Embedded = new TmEmbeddedVenues
        {
            Venues =
            [
                new TmVenue
                {
                    Name = "Sala Capitol",
                    Address = new TmAddress { Line1 = "Bulevardul Regele Carol I" },
                    City = new TmCity { Name = "Timisoara" },
                    Location = new TmLocation { Latitude = "45.75", Longitude = "21.22" },
                }
            ]
        },
        PriceRanges = [new TmPriceRange { Min = 75m }],
        Classifications =
        [
            new TmClassification { Primary = false, Segment = new TmNamed { Name = "Undefined" } },
            new TmClassification { Primary = true, Segment = new TmNamed { Name = "Music" } },
        ],
        Images =
        [
            new TmImage { Url = "small.jpg", Width = 100 },
            new TmImage { Url = "big.jpg", Width = 1000 },
        ],
    };

    [Fact]
    public void Maps_all_fields()
    {
        var e = TicketmasterEventMapper.MapToEvent(FullTmEvent(), "ticketmaster");

        Assert.NotNull(e);
        Assert.Equal("tm-1", e.ExternalId);
        Assert.Equal("ticketmaster", e.ExternalSource);
        Assert.Equal("Concert Symphonic", e.Title);
        Assert.Equal(EventCategory.Music, e.Category); // primary classification wins
        Assert.Equal("Sala Capitol", e.VenueName);
        Assert.Equal("Bulevardul Regele Carol I, Timisoara", e.Address);
        Assert.Equal(45.75, e.Latitude);
        Assert.Equal(21.22, e.Longitude);
        Assert.Equal(75m, e.Price);
        Assert.Equal("big.jpg", e.ImageUrl); // widest image wins
        Assert.Equal(new DateTime(2026, 12, 5, 19, 0, 0, DateTimeKind.Utc), e.StartUtc);
        Assert.Equal(new DateTime(2026, 12, 5, 22, 0, 0, DateTimeKind.Utc), e.EndUtc);
    }

    [Fact]
    public void Missing_start_returns_null()
    {
        var tm = FullTmEvent();
        tm.Dates = new TmDates();
        Assert.Null(TicketmasterEventMapper.MapToEvent(tm, "ticketmaster"));
    }

    [Fact]
    public void Empty_name_returns_null()
    {
        var tm = FullTmEvent();
        tm.Name = " ";
        Assert.Null(TicketmasterEventMapper.MapToEvent(tm, "ticketmaster"));
    }

    [Fact]
    public void Missing_end_defaults_to_three_hours_after_start()
    {
        var tm = FullTmEvent();
        tm.Dates!.End = null;
        var e = TicketmasterEventMapper.MapToEvent(tm, "ticketmaster");
        Assert.Equal(e!.StartUtc.AddHours(3), e.EndUtc);
    }

    [Fact]
    public void Long_title_is_truncated_to_200()
    {
        var tm = FullTmEvent();
        tm.Name = new string('x', 250);
        var e = TicketmasterEventMapper.MapToEvent(tm, "ticketmaster");
        Assert.Equal(200, e!.Title.Length);
    }

    [Fact]
    public void Missing_venue_uses_TBA()
    {
        var tm = FullTmEvent();
        tm.Embedded = new TmEmbeddedVenues();
        var e = TicketmasterEventMapper.MapToEvent(tm, "ticketmaster");
        Assert.Equal("TBA", e!.VenueName);
        Assert.Null(e.Latitude);
    }

    [Fact]
    public void No_description_falls_back_to_name()
    {
        var tm = FullTmEvent();
        tm.Info = null;
        tm.PleaseNote = null;
        var e = TicketmasterEventMapper.MapToEvent(tm, "ticketmaster");
        Assert.Equal(tm.Name, e!.Description);
    }

    [Theory]
    [InlineData("Music", EventCategory.Music)]
    [InlineData("Sports", EventCategory.Sports)]
    [InlineData("Arts & Theatre", EventCategory.Arts)]
    [InlineData("Film", EventCategory.Film)]
    [InlineData("Miscellaneous", EventCategory.Other)]
    [InlineData(null, EventCategory.Other)]
    public void Segment_maps_to_category(string? segment, EventCategory expected)
    {
        var classifications = segment is null
            ? null
            : new List<TmClassification>
            {
                new() { Primary = true, Segment = new TmNamed { Name = segment } }
            };

        Assert.Equal(expected, TicketmasterEventMapper.MapCategory(classifications));
    }

    [Fact]
    public void Local_date_without_datetime_is_parsed()
    {
        var result = TicketmasterEventMapper.ToUtc(new TmStart
        {
            LocalDate = "2026-12-05",
            LocalTime = "19:30:00",
        });
        Assert.NotNull(result);
        Assert.Equal(DateTimeKind.Utc, result.Value.Kind);
    }

    [Fact]
    public void Garbage_date_returns_null()
    {
        Assert.Null(TicketmasterEventMapper.ToUtc(new TmStart { LocalDate = "not-a-date" }));
    }
}
