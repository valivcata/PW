using Gatherly.Domain.Entities;
using Gatherly.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Gatherly.Infrastructure.Persistence;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");

        await db.Database.MigrateAsync();

        var organizer = await userManager.FindByEmailAsync("organizer@gatherly.dev");
        if (organizer is null)
        {
            organizer = new ApplicationUser
            {
                UserName = "organizer@gatherly.dev",
                Email = "organizer@gatherly.dev",
                EmailConfirmed = true,
                DisplayName = "Gatherly Timisoara",
            };
            await userManager.CreateAsync(organizer, "Gatherly123");
        }

        if (await db.Events.AnyAsync())
            return;

        var now = DateTime.UtcNow.Date;
        var events = new List<Event>
        {
            E(organizer.Id, "Jazz Night at Vineri 15", "Live jazz session with local artists in the heart of Fabric district.", EventCategory.Music, now.AddDays(3).AddHours(20), 3, "Vineri 15", "Strada Emanoil Ungureanu 15, Timisoara", 45.7494, 21.2272, 30m, 80),
            E(organizer.Id, "Timisoara Street Food Festival", "Three days of food trucks, craft beer and live cooking in Victory Square.", EventCategory.Food, now.AddDays(6).AddHours(12), 8, "Piata Victoriei", "Piata Victoriei, Timisoara", 45.7537, 21.2257, null, null),
            E(organizer.Id, "Art Exhibition: Banat Contemporary", "Opening of a collective exhibition by emerging Banat artists.", EventCategory.Arts, now.AddDays(5).AddHours(18), 1, "Muzeul de Arta", "Piata Unirii 1, Timisoara", 45.7578, 21.2289, 15m, 120),
            E(organizer.Id, "Sunday Morning Run - Bega Riverside", "Casual 5k/10k group run along the Bega canal. All levels welcome.", EventCategory.Sports, now.AddDays(4).AddHours(8), 0.5, "Podul Maria", "Splaiul Nistrului, Timisoara", 45.7480, 21.2400, null, 50),
            E(organizer.Id, "Timisoara .NET Meetup", "Talks on ASP.NET Core, EF Core and Blazor. Pizza afterwards.", EventCategory.Tech, now.AddDays(9).AddHours(18) + TimeSpan.FromMinutes(30), 1, "Cowork Timisoara", "Strada Eroilor de la Tisa 2, Timisoara", 45.7560, 21.2330, null, 60),
            E(organizer.Id, "DJ Set: Rooftop Session", "Sunset DJ set on the Iulius Town rooftop terrace.", EventCategory.Nightlife, now.AddDays(7).AddHours(19), 4, "Iulius Town Rooftop", "Strada Aristide Demetriade 1, Timisoara", 45.7720, 21.2460, 50m, 200),
            E(organizer.Id, "Community Cleanup - Parcul Botanic", "Volunteer cleanup morning in the Botanical Park. Gloves and bags provided.", EventCategory.Community, now.AddDays(10).AddHours(9), 0.25, "Parcul Botanic", "Aleea Durazzo, Timisoara", 45.7600, 21.2200, null, 40),
            E(organizer.Id, "Hamlet - Teatrul National", "Classic Shakespeare staged by the National Theatre ensemble.", EventCategory.Theatre, now.AddDays(12).AddHours(19), 2, "Teatrul National Timisoara", "Strada Marasesti 2, Timisoara", 45.7520, 21.2240, 60m, 300),
            E(organizer.Id, "Open Air Cinema: Romanian Films", "Outdoor screening of award-winning Romanian short films.", EventCategory.Film, now.AddDays(14).AddHours(21), 1, "Cetate Bastion", "Strada Hector, Timisoara", 45.7580, 21.2310, null, 150),
            E(organizer.Id, "Craft Beer & Board Games", "Weekly board game night at a local craft beer pub. Bring a game or join a table.", EventCategory.Nightlife, now.AddDays(2).AddHours(19), 0.3, "Bereta Taproom", "Strada Dragalina, Timisoara", 45.7510, 21.2380, null, 45),
            E(organizer.Id, "Startup Pitch Night", "Local founders pitch to a panel of investors. Networking after.", EventCategory.Tech, now.AddDays(16).AddHours(18), 1, "DevPlant Cowork", "Strada Michelangelo 18, Timisoara", 45.7640, 21.2320, null, 100),
            E(organizer.Id, "Folk Dance Workshop", "Learn traditional Banat dances with instructors from Ansamblul Timisoara.", EventCategory.Community, now.AddDays(8).AddHours(17), 1, "Casa Tineretului", "Strada Aries 19, Timisoara", 45.7490, 21.2260, 20m, 35),
        };

        db.Events.AddRange(events);
        await db.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} events", events.Count);
    }

    private static Event E(
        string organizerId, string title, string description, EventCategory category,
        DateTime start, double durationDays, string venue, string address,
        double lat, double lng, decimal? price, int? capacity) => new()
        {
            Id = Guid.NewGuid(),
            Title = title,
            Description = description,
            Category = category,
            StartUtc = start,
            EndUtc = start.AddDays(durationDays),
            VenueName = venue,
            Address = address,
            Latitude = lat,
            Longitude = lng,
            Price = price,
            Capacity = capacity,
            OrganizerId = organizerId,
        };
}
