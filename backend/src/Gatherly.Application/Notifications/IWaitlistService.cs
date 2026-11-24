namespace Gatherly.Application.Notifications;

public interface IWaitlistService
{
    /// <summary>
    /// Fills free spots of an event from its waitlist (oldest first), saves the changes and emails
    /// every promoted user. Returns how many people were promoted.
    /// </summary>
    Task<int> PromoteAsync(Guid eventId, CancellationToken cancellationToken = default);
}
