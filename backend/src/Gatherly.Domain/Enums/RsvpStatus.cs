namespace Gatherly.Domain.Enums;

public enum RsvpStatus
{
    Interested,
    Going,
    NotGoing,
    /// <summary>Wanted to go but the event was full; promoted to Going (oldest first) when a spot opens.</summary>
    Waitlisted
}
