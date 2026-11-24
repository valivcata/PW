using Gatherly.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Gatherly.Infrastructure.Persistence.Configurations;

public class EventConfiguration : IEntityTypeConfiguration<Event>
{
    public void Configure(EntityTypeBuilder<Event> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Title).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Description).HasMaxLength(4000).IsRequired();
        builder.Property(e => e.VenueName).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Address).HasMaxLength(300).IsRequired();
        builder.Property(e => e.Category).HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.Price).HasPrecision(10, 2);
        builder.Property(e => e.ImageUrl).HasMaxLength(1000);

        builder.HasOne(e => e.Organizer)
            .WithMany(u => u.OrganizedEvents)
            .HasForeignKey(e => e.OrganizerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(e => e.ExternalSource).HasMaxLength(50);
        builder.Property(e => e.ExternalId).HasMaxLength(100);
        builder.Property(e => e.ExternalUrl).HasMaxLength(1000);

        builder.HasIndex(e => e.StartUtc);
        builder.HasIndex(e => e.Category);
        builder.HasIndex(e => new { e.Latitude, e.Longitude });
        builder.HasIndex(e => new { e.ExternalSource, e.ExternalId })
            .IsUnique()
            .HasFilter("\"ExternalSource\" IS NOT NULL AND \"ExternalId\" IS NOT NULL");
    }
}
