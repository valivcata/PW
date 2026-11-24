using Gatherly.Domain.Entities;
using Gatherly.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Gatherly.Infrastructure.Persistence;

/// <summary>
/// Extra demo content for development: 40 more Timișoara events (35 upcoming, 5 already over), 8 demo people,
/// their RSVPs and reviews. Idempotent: only events whose title doesn't exist yet are added, and RSVPs/reviews
/// are created only for those newly added events, so nothing a user created or changed is touched.
/// Venue coordinates are approximate.
/// </summary>
internal static class DemoDataSeeder
{
    private const string DemoPassword = "Gatherly123";

    private static readonly (string Email, string Name)[] DemoPeople =
    [
        ("ana.popescu@gatherly.dev", "Ana Popescu"),
        ("andrei.ionescu@gatherly.dev", "Andrei Ionescu"),
        ("maria.dumitrescu@gatherly.dev", "Maria Dumitrescu"),
        ("mihai.stan@gatherly.dev", "Mihai Stan"),
        ("elena.georgescu@gatherly.dev", "Elena Georgescu"),
        ("radu.marin@gatherly.dev", "Radu Marin"),
        ("cristina.barbu@gatherly.dev", "Cristina Barbu"),
        ("vlad.munteanu@gatherly.dev", "Vlad Munteanu"),
    ];

    /// <param name="Day">Days from today (negative = in the past).</param>
    /// <param name="Hour">Local Timișoara time (winter, UTC+2).</param>
    private record Demo(
        string Title, string Description, EventCategory Category,
        int Day, int Hour, int Minute, double Hours,
        string Venue, string Address, double Lat, double Lng,
        decimal? Price, int? Capacity,
        int Going = -1, bool Waitlist = false);

    private static readonly Demo[] Events =
    [
        // Music
        new("Banatul Philharmonic: Beethoven's 9th", "The Banatul Philharmonic and choir perform Beethoven's Ninth Symphony, closing with the Ode to Joy.", EventCategory.Music, 5, 19, 0, 2.5, "Sala Capitol", "Bulevardul C.D. Loga 2, Timisoara", 45.7537, 21.2275, 60m, 500),
        new("Indie Night at Aethernativ", "Three local indie bands on one small stage. Doors at 20:30, first band at 21:00.", EventCategory.Music, 9, 21, 0, 4, "Aethernativ", "Piata Unirii 14, Timisoara", 45.7580, 21.2297, 25m, 90),
        new("Acoustic Sunset on the Bega", "Bring a blanket: acoustic guitar and vocals on the riverbank as the sun goes down.", EventCategory.Music, 13, 16, 30, 2, "Faleza Bega", "Splaiul Tudor Vladimirescu, Timisoara", 45.7484, 21.2290, null, null),
        new("Christmas Carols at the Cathedral", "Traditional Romanian carols (colinde) sung by the Metropolitan Cathedral choir.", EventCategory.Music, 24, 18, 0, 1.5, "Catedrala Mitropolitana", "Bulevardul Regele Ferdinand I, Timisoara", 45.7509, 21.2244, null, 400),
        new("Jazz Trio at Scart Loc Lejer", "An intimate evening of standards and originals in a cosy villa turned cultural cafe.", EventCategory.Music, 16, 20, 0, 2.5, "Scart Loc Lejer", "Strada Mihai Eminescu 5, Timisoara", 45.7468, 21.2338, 20m, 40),

        // Food
        new("Christmas Market: Mulled Wine & Kurtos", "Opening night of the Christmas market: mulled wine, chimney cake, local crafts and lights.", EventCategory.Food, 3, 17, 0, 6, "Piata Victoriei", "Piata Victoriei, Timisoara", 45.7537, 21.2257, null, null),
        new("Banat Wine Tasting", "Six wines from Recas and the Minis hills, paired with local cheese. Very limited places.", EventCategory.Food, 11, 19, 0, 2.5, "Crama Wine Bar", "Strada Vasile Alecsandri 3, Timisoara", 45.7570, 21.2275, 120m, 4, Going: 4, Waitlist: true),
        new("Cooking Class: Traditional Banat Dishes", "Learn to cook papricas, galuste and a Banat-style strudel, then eat what you made.", EventCategory.Food, 15, 17, 0, 3, "Atelier Gastronomic", "Strada Marasesti 10, Timisoara", 45.7553, 21.2262, 150m, 12),
        new("Sunday Farmers Market", "Fresh produce, honey, cheese and bread straight from farmers around Timis county.", EventCategory.Food, 4, 9, 0, 5, "Piata 700", "Piata 700, Timisoara", 45.7602, 21.2232, null, null),

        // Arts
        new("Photo Exhibition: Timisoara Then and Now", "Archive photos of the city side by side with the same places today. Open daily for two weeks.", EventCategory.Arts, 2, 10, 0, 24 * 14, "Bastionul Theresia", "Strada Hector 2, Timisoara", 45.7568, 21.2318, 10m, null),
        new("Ceramics Workshop for Beginners", "Hands-on pottery: wheel throwing and hand building. Clay, tools and firing included.", EventCategory.Arts, 10, 16, 0, 3, "Atelier Ceramica 13", "Strada Gheorghe Lazar 13, Timisoara", 45.7590, 21.2260, 120m, 6, Going: 5),
        new("Street Art Walking Tour", "Discover the murals of Fabric and Iosefin with a local artist as your guide.", EventCategory.Arts, 12, 15, 0, 2, "Piata Libertatii", "Piata Libertatii, Timisoara", 45.7562, 21.2283, null, 25),
        new("Contemporary Dance: Bodies in Motion", "A new contemporary dance piece by a young Timisoara company.", EventCategory.Arts, 22, 19, 30, 1.5, "Teatrul Maghiar Csiky Gergely", "Strada Alba Iulia 2, Timisoara", 45.7558, 21.2268, 45m, 150),

        // Theatre
        new("Opera: La Traviata", "Verdi's La Traviata staged by the Romanian National Opera Timisoara.", EventCategory.Theatre, 18, 19, 0, 3, "Opera Nationala Romana Timisoara", "Strada Marasesti 2, Timisoara", 45.7546, 21.2259, 80m, 600),
        new("Puppet Theatre for Kids: Little Red Riding Hood", "A colourful puppet show for children aged 3 to 8.", EventCategory.Theatre, 7, 11, 0, 1, "Teatrul Merlin", "Piata Victoriei 6, Timisoara", 45.7545, 21.2262, 25m, 120),
        new("Improv Comedy Show", "Fully improvised comedy built from audience suggestions. No two shows are the same.", EventCategory.Theatre, 9, 20, 0, 1.5, "Ambasada", "Strada Gheorghe Lazar 10, Timisoara", 45.7593, 21.2262, 30m, 80),
        new("Faust at the German State Theatre", "Goethe's Faust in German with Romanian surtitles.", EventCategory.Theatre, 23, 19, 0, 2.5, "Teatrul German de Stat", "Strada Marasesti 2, Timisoara", 45.7544, 21.2257, 40m, 300),

        // Sports
        new("Poli Timisoara Home Match", "Cheer for Poli at the Dan Paltinisanu stadium. Family stand available.", EventCategory.Sports, 6, 17, 0, 2, "Stadionul Dan Paltinisanu", "Bulevardul Pestalozzi, Timisoara", 45.7413, 21.2440, 25m, 5000),
        new("SCM Timisoara Basketball", "SCM Timisoara hosts the league leaders. Expect a loud crowd.", EventCategory.Sports, 14, 19, 0, 2, "Sala Constantin Jude", "Aleea Sportivilor, Timisoara", 45.7398, 21.2458, 20m, 1500),
        new("Timisoara Night Run 10K", "A 10 km evening run through the lit-up city centre. Medal for every finisher.", EventCategory.Sports, 17, 19, 0, 2, "Piata Victoriei", "Piata Victoriei, Timisoara", 45.7537, 21.2257, 60m, 800),
        new("Yoga in the Park", "Gentle morning yoga for all levels. Bring your own mat.", EventCategory.Sports, 5, 9, 0, 1.5, "Parcul Rozelor", "Parcul Rozelor, Timisoara", 45.7505, 21.2335, null, 30),
        new("Bouldering Intro Session", "Learn the basics of bouldering with a coach. Shoes included.", EventCategory.Sports, 9, 18, 0, 2, "Bouldering Timisoara", "Calea Aradului, Timisoara", 45.7745, 21.2240, 40m, 10),

        // Tech
        new("React Timisoara Meetup", "Two talks: React Server Components in practice and testing with Vitest. Snacks provided.", EventCategory.Tech, 8, 18, 30, 2.5, "UVT - Facultatea de Informatica", "Bulevardul Vasile Parvan 4, Timisoara", 45.7470, 21.2310, null, 80),
        new("AI & Machine Learning Night", "Local engineers share how they use LLMs and ML in production, followed by networking.", EventCategory.Tech, 12, 18, 0, 3, "Universitatea Politehnica", "Bulevardul Vasile Parvan 2, Timisoara", 45.7473, 21.2262, null, 120),
        new("Hackathon: Smart City Timisoara", "36 hours to build apps for a smarter city: mobility, energy and public services. Prizes for the top 3 teams.", EventCategory.Tech, 21, 10, 0, 32, "Iulius Town - The Office", "Piata Consiliul Europei 2, Timisoara", 45.7665, 21.2285, null, 100),
        new("Women in Tech Breakfast", "Coffee, croissants and honest conversations about careers in tech.", EventCategory.Tech, 7, 9, 0, 2, "UBC Cowork", "Strada Gheorghe Lazar 24, Timisoara", 45.7605, 21.2263, null, 30),

        // Nightlife
        new("Karaoke Night at Beraria 700", "Grab the mic: hundreds of songs, Romanian and international.", EventCategory.Nightlife, 4, 21, 0, 4, "Beraria 700", "Piata 700, Timisoara", 45.7599, 21.2238, null, 60),
        new("Silent Disco in Piata Unirii", "Three DJs, three channels, one square. Headphones included.", EventCategory.Nightlife, 11, 21, 0, 3, "Piata Unirii", "Piata Unirii, Timisoara", 45.7577, 21.2290, 30m, 150),
        new("Salsa & Bachata Social", "Beginner class at 20:30, then social dancing until late.", EventCategory.Nightlife, 15, 20, 30, 4, "Cuib d'Arte", "Strada Vasile Alecsandri 1, Timisoara", 45.7566, 21.2283, 20m, 80),
        new("Techno Night at Daos", "Resident DJs and a guest from Berlin. Strictly 18+.", EventCategory.Nightlife, 6, 23, 0, 5, "Club Daos", "Strada Paris 1, Timisoara", 45.7498, 21.2258, 40m, 300),

        // Community
        new("Christmas Charity Bazaar", "Handmade gifts and cakes; all proceeds go to local children's charities.", EventCategory.Community, 16, 10, 0, 8, "Piata Libertatii", "Piata Libertatii, Timisoara", 45.7562, 21.2283, null, null),
        new("Language Exchange: English-Romanian", "Practise a language over tea. Half the time in English, half in Romanian.", EventCategory.Community, 6, 19, 0, 2, "Ceainaria Infinitea", "Strada Marasesti 8, Timisoara", 45.7555, 21.2263, null, 30),
        new("Book Club: Herta Muller", "This month: The Land of Green Plums by Timisoara-born Nobel laureate Herta Muller.", EventCategory.Community, 14, 18, 0, 2, "Biblioteca Judeteana Timis", "Piata Libertatii 3, Timisoara", 45.7563, 21.2286, null, 20),
        new("Volunteer Day at the Animal Shelter", "Walk dogs, clean and socialize cats. Transport from the centre provided.", EventCategory.Community, 10, 10, 0, 4, "Adapostul Pet Hope", "Calea Sagului, Timisoara", 45.7255, 21.2135, null, 15),

        // Film
        new("Film Night: Romanian New Wave", "Double bill of Romanian New Wave classics, with a short talk in between.", EventCategory.Film, 10, 19, 0, 2.5, "Cinema Victoria", "Piata Victoriei 7, Timisoara", 45.7538, 21.2265, 20m, 200),

        // Already over: these show reviews (log in as the organizer and open My events > Past).
        new("Autumn Wine Festival", "Wineries from all over Banat in one square, with live folk music.", EventCategory.Food, -12, 14, 0, 6, "Piata Victoriei", "Piata Victoriei, Timisoara", 45.7537, 21.2257, null, null, Going: 7),
        new("Halloween Rock Party", "Costume contest and two local rock bands at the old fortress walls.", EventCategory.Nightlife, -24, 22, 0, 5, "Bastionul Theresia", "Strada Hector 2, Timisoara", 45.7568, 21.2318, 30m, 250, Going: 6),
        new("JS Conference Timisoara", "A full day of JavaScript talks, from TypeScript tips to performance tuning.", EventCategory.Tech, -6, 9, 0, 9, "Iulius Town - The Office", "Piata Consiliul Europei 2, Timisoara", 45.7665, 21.2285, 150m, 300, Going: 8),
        new("Photography Walk: Fabric District", "An afternoon photo walk through the Art Nouveau facades of Fabric.", EventCategory.Arts, -3, 15, 0, 2, "Piata Traian", "Piata Traian, Timisoara", 45.7585, 21.2485, null, 20, Going: 5),
        new("Timisoara Half Marathon", "21 km through the city's parks and along the Bega.", EventCategory.Sports, -18, 9, 0, 4, "Parcul Central", "Parcul Central, Timisoara", 45.7525, 21.2230, 80m, 1000, Going: 6),
    ];

    private static readonly (int Rating, string Comment)[] ReviewPool =
    [
        (5, "Amazing atmosphere, I'll definitely come again!"),
        (5, "Perfectly organized from start to finish. Thank you!"),
        (4, "Really enjoyed it. It got a bit crowded towards the end."),
        (4, "Great event, good people. Would love a longer version."),
        (5, "One of the best things I've done in Timisoara this year."),
        (3, "Nice idea, but it started late and the sound wasn't great."),
        (4, "Good value and friendly organizers."),
        (2, "Too crowded and hard to see anything. Needs a bigger venue."),
    ];

    public static async Task SeedAsync(
        ApplicationDbContext db, UserManager<ApplicationUser> userManager, ApplicationUser organizer, ILogger logger)
    {
        var people = new List<ApplicationUser>();
        foreach (var (email, name) in DemoPeople)
        {
            var user = await userManager.FindByEmailAsync(email);
            if (user is null)
            {
                user = new ApplicationUser { UserName = email, Email = email, EmailConfirmed = true, DisplayName = name };
                var result = await userManager.CreateAsync(user, DemoPassword);
                if (!result.Succeeded)
                {
                    logger.LogWarning("Could not create demo user {Email}: {Errors}", email, string.Join(", ", result.Errors.Select(e => e.Description)));
                    continue;
                }
            }
            people.Add(user);
        }

        var existingTitles = (await db.Events.Select(e => e.Title).ToListAsync()).ToHashSet();
        var toAdd = Events.Where(d => !existingTitles.Contains(d.Title)).ToList();
        if (toAdd.Count == 0) return;

        var today = DateTime.UtcNow.Date;
        var random = new Random(2026); // fixed seed: the same demo data on every machine
        var reviewIndex = 0;

        foreach (var d in toAdd)
        {
            var start = today.AddDays(d.Day).AddHours(d.Hour - 2).AddMinutes(d.Minute); // local (UTC+2) -> UTC
            var e = new Event
            {
                Id = Guid.NewGuid(),
                Title = d.Title,
                Description = d.Description,
                Category = d.Category,
                StartUtc = start,
                EndUtc = start.AddHours(d.Hours),
                VenueName = d.Venue,
                Address = d.Address,
                Latitude = d.Lat,
                Longitude = d.Lng,
                Price = d.Price,
                Capacity = d.Capacity,
                OrganizerId = organizer.Id,
                CreatedAtUtc = start.AddDays(-30),
                UpdatedAtUtc = start.AddDays(-30),
            };
            db.Events.Add(e);

            // Who answers: a shuffled slice of the demo people.
            var shuffled = people.OrderBy(_ => random.Next()).ToList();
            var goingCount = d.Going >= 0 ? d.Going : random.Next(0, 6);
            if (d.Capacity is { } cap) goingCount = Math.Min(goingCount, cap);
            goingCount = Math.Min(goingCount, shuffled.Count);

            var answeredAt = start.AddDays(-20);
            var going = shuffled.Take(goingCount).ToList();
            foreach (var p in going)
                db.EventAttendees.Add(new EventAttendee { EventId = e.Id, UserId = p.Id, Status = RsvpStatus.Going, RespondedAtUtc = answeredAt = answeredAt.AddHours(3) });

            var rest = shuffled.Skip(goingCount).ToList();
            if (d.Waitlist && rest.Count > 0)
            {
                db.EventAttendees.Add(new EventAttendee { EventId = e.Id, UserId = rest[0].Id, Status = RsvpStatus.Waitlisted, RespondedAtUtc = answeredAt.AddHours(3) });
                rest.RemoveAt(0);
            }
            else if (d.Day > 0)
            {
                foreach (var p in rest.Take(random.Next(0, 3)))
                    db.EventAttendees.Add(new EventAttendee { EventId = e.Id, UserId = p.Id, Status = RsvpStatus.Interested, RespondedAtUtc = answeredAt.AddHours(5) });
            }

            // Past events: most of the people who went leave a review.
            if (d.Day < 0)
            {
                foreach (var p in going.Take(Math.Max(2, going.Count - 2)))
                {
                    var (rating, comment) = ReviewPool[reviewIndex++ % ReviewPool.Length];
                    var at = e.EndUtc.AddHours(12 + reviewIndex);
                    db.Reviews.Add(new Review
                    {
                        Id = Guid.NewGuid(), EventId = e.Id, UserId = p.Id,
                        Rating = rating, Comment = comment, CreatedAtUtc = at, UpdatedAtUtc = at,
                    });
                }
            }
        }

        await db.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} demo events with RSVPs and reviews", toAdd.Count);
    }
}
