using Gatherly.Infrastructure.Notifications;

namespace Gatherly.UnitTests.Notifications;

public class EmailFormattingTests
{
    // 10:00 UTC on 24 Nov = 12:00 in Timișoara (UTC+2 in winter).
    private static readonly DateTime Now = new(2026, 11, 24, 10, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Same_local_day_is_today()
    {
        Assert.Equal("Azi", EmailFormatting.RelativeDay(new DateTime(2026, 11, 24, 18, 0, 0, DateTimeKind.Utc), Now));
    }

    [Fact]
    public void Next_local_day_is_tomorrow()
    {
        Assert.Equal("Mâine", EmailFormatting.RelativeDay(new DateTime(2026, 11, 25, 18, 0, 0, DateTimeKind.Utc), Now));
    }

    [Fact]
    public void Uses_romanian_time_not_utc()
    {
        // 23:30 UTC on the 24th is already 01:30 on the 25th in Timișoara.
        Assert.Equal("Mâine", EmailFormatting.RelativeDay(new DateTime(2026, 11, 24, 23, 30, 0, DateTimeKind.Utc), Now));
        Assert.Equal("01:30", EmailFormatting.Time(new DateTime(2026, 11, 24, 23, 30, 0, DateTimeKind.Utc)));
    }
}
