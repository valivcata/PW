namespace Gatherly.Infrastructure.Integrations.Ticketmaster;

public class TicketmasterOptions
{
    public const string SectionName = "Ticketmaster";

    public string ApiKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://app.ticketmaster.com/discovery/v2/";
    public string City { get; set; } = "Timisoara";
    public string CountryCode { get; set; } = "RO";
    public int PageSize { get; set; } = 200;
    public int MaxPages { get; set; } = 5;
}
