using Gatherly.Application.Integrations;
using Microsoft.AspNetCore.Mvc;

namespace Gatherly.API.Controllers;

[ApiController]
[Route("api/integrations")]
public class IntegrationsController(ITicketmasterSyncService ticketmasterSync) : ControllerBase
{
    /// <summary>Imports/updates Timisoara events from the Ticketmaster Discovery API.</summary>
    [HttpPost("ticketmaster/sync")]
    public async Task<ActionResult<EventSyncResult>> SyncTicketmaster(CancellationToken cancellationToken)
    {
        var result = await ticketmasterSync.SyncAsync(cancellationToken);
        return Ok(result);
    }
}
