using Gatherly.Domain.Entities;

namespace Gatherly.Application.Auth;

public interface ITokenService
{
    (string Token, DateTime ExpiresAtUtc) CreateAccessToken(ApplicationUser user);
}
