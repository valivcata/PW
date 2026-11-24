using System.Globalization;
using System.Net;

namespace Gatherly.Infrastructure.Notifications;

/// <summary>Shared bits for the HTML emails: Romanian local time, event links and a simple layout.</summary>
internal static class EmailFormatting
{
    private static readonly CultureInfo Ro = CultureInfo.GetCultureInfo("ro-RO");

    public static DateTime ToLocalTime(DateTime utc)
    {
        try
        {
            return TimeZoneInfo.ConvertTimeFromUtc(
                DateTime.SpecifyKind(utc, DateTimeKind.Utc),
                TimeZoneInfo.FindSystemTimeZoneById("Europe/Bucharest"));
        }
        catch (TimeZoneNotFoundException)
        {
            return utc;
        }
    }

    /// <summary>"marți, 26 noiembrie 2026, 20:00"</summary>
    public static string LongDate(DateTime utc) => ToLocalTime(utc).ToString("dddd, d MMMM yyyy, HH:mm", Ro);

    /// <summary>"Azi" / "Mâine" / "Joi, 26 nov." relative to <paramref name="nowUtc"/>, in Romanian local time.</summary>
    public static string RelativeDay(DateTime startUtc, DateTime nowUtc)
    {
        var start = ToLocalTime(startUtc).Date;
        var today = ToLocalTime(nowUtc).Date;
        var days = (start - today).Days;
        return days switch
        {
            0 => "Azi",
            1 => "Mâine",
            _ => Ro.TextInfo.ToTitleCase(start.ToString("dddd, d MMM", Ro)),
        };
    }

    public static string Time(DateTime utc) => ToLocalTime(utc).ToString("HH:mm", Ro);

    public static string EventLink(string frontendBaseUrl, Guid eventId) => $"{frontendBaseUrl.TrimEnd('/')}/events/{eventId}";

    public static string Encode(string? text) => WebUtility.HtmlEncode(text ?? string.Empty);

    /// <summary>Wraps body HTML in the common email frame.</summary>
    public static string Layout(string innerHtml) => $"""
        <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222;max-width:560px">
          {innerHtml}
          <p style="color:#999;font-size:12px;margin-top:24px">Gatherly · evenimente în Timișoara</p>
        </div>
        """;
}
