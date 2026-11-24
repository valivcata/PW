using System.Text.Json.Serialization;

namespace Gatherly.Infrastructure.Integrations.Ticketmaster;

public class TmEventSearchResponse
{
    [JsonPropertyName("_embedded")] public TmEmbeddedEvents? Embedded { get; set; }
    [JsonPropertyName("page")] public TmPage? Page { get; set; }
}

public class TmEmbeddedEvents
{
    [JsonPropertyName("events")] public List<TmEvent> Events { get; set; } = [];
}

public class TmPage
{
    [JsonPropertyName("totalPages")] public int TotalPages { get; set; }
    [JsonPropertyName("number")] public int Number { get; set; }
}

public class TmEvent
{
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("info")] public string? Info { get; set; }
    [JsonPropertyName("pleaseNote")] public string? PleaseNote { get; set; }
    [JsonPropertyName("url")] public string? Url { get; set; }
    [JsonPropertyName("dates")] public TmDates? Dates { get; set; }
    [JsonPropertyName("_embedded")] public TmEmbeddedVenues? Embedded { get; set; }
    [JsonPropertyName("priceRanges")] public List<TmPriceRange>? PriceRanges { get; set; }
    [JsonPropertyName("classifications")] public List<TmClassification>? Classifications { get; set; }
    [JsonPropertyName("images")] public List<TmImage>? Images { get; set; }
}

public class TmDates
{
    [JsonPropertyName("start")] public TmStart? Start { get; set; }
    [JsonPropertyName("end")] public TmEnd? End { get; set; }
}

public class TmStart
{
    [JsonPropertyName("dateTime")] public DateTime? DateTime { get; set; }
    [JsonPropertyName("localDate")] public string? LocalDate { get; set; }
    [JsonPropertyName("localTime")] public string? LocalTime { get; set; }
}

public class TmEnd
{
    [JsonPropertyName("dateTime")] public DateTime? DateTime { get; set; }
}

public class TmEmbeddedVenues
{
    [JsonPropertyName("venues")] public List<TmVenue> Venues { get; set; } = [];
}

public class TmVenue
{
    [JsonPropertyName("name")] public string? Name { get; set; }
    [JsonPropertyName("address")] public TmAddress? Address { get; set; }
    [JsonPropertyName("city")] public TmCity? City { get; set; }
    [JsonPropertyName("location")] public TmLocation? Location { get; set; }
}

public class TmAddress
{
    [JsonPropertyName("line1")] public string? Line1 { get; set; }
}

public class TmCity
{
    [JsonPropertyName("name")] public string? Name { get; set; }
}

public class TmLocation
{
    [JsonPropertyName("latitude")] public string? Latitude { get; set; }
    [JsonPropertyName("longitude")] public string? Longitude { get; set; }
}

public class TmPriceRange
{
    [JsonPropertyName("min")] public decimal? Min { get; set; }
}

public class TmClassification
{
    [JsonPropertyName("primary")] public bool Primary { get; set; }
    [JsonPropertyName("segment")] public TmNamed? Segment { get; set; }
    [JsonPropertyName("genre")] public TmNamed? Genre { get; set; }
}

public class TmNamed
{
    [JsonPropertyName("name")] public string? Name { get; set; }
}

public class TmImage
{
    [JsonPropertyName("url")] public string? Url { get; set; }
    [JsonPropertyName("ratio")] public string? Ratio { get; set; }
    [JsonPropertyName("width")] public int Width { get; set; }
}
