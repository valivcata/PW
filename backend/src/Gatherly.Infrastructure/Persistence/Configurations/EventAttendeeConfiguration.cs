using Gatherly.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Gatherly.Infrastructure.Persistence.Configurations;

public class EventAttendeeConfiguration : IEntityTypeConfiguration<EventAttendee>
{
    public void Configure(EntityTypeBuilder<EventAttendee> builder)
    {
        builder.HasKey(a => new { a.EventId, a.UserId });

        builder.Property(a => a.Status).HasConversion<string>().HasMaxLength(20);

        builder.HasOne(a => a.Event)
            .WithMany(e => e.Attendees)
            .HasForeignKey(a => a.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.User)
            .WithMany(u => u.Rsvps)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
