namespace Gatherly.Application.Integrations;

public record EventSyncResult(int Fetched, int Created, int Updated, int Skipped);

public interface ITicketmasterSyncService
{
    Task<EventSyncResult> SyncAsync(CancellationToken cancellationToken = default);
}
