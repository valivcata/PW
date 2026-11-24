using Gatherly.Application.Auth;
using Gatherly.Application.Integrations;
using Gatherly.Domain.Entities;
using Gatherly.Infrastructure.Integrations.Ticketmaster;
using Gatherly.Infrastructure.Persistence;
using Gatherly.Infrastructure.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Gatherly.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddIdentityCore<ApplicationUser>(options =>
            {
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequiredLength = 8;
            })
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        services.AddScoped<ITokenService, JwtTokenService>();

        services.AddOptions<TicketmasterOptions>()
            .Bind(configuration.GetSection(TicketmasterOptions.SectionName));

        services.AddHttpClient<ITicketmasterSyncService, TicketmasterSyncService>((sp, client) =>
        {
            var opts = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<TicketmasterOptions>>().Value;
            client.BaseAddress = new Uri(opts.BaseUrl);
        });

        return services;
    }
}
