using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Gatherly.Application.Auth;
using Gatherly.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Gatherly.Infrastructure.Security;

public class JwtTokenService(IConfiguration configuration) : ITokenService
{
    public (string Token, DateTime ExpiresAtUtc) CreateAccessToken(ApplicationUser user)
    {
        var jwt = configuration.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));
        var expires = DateTime.UtcNow.AddMinutes(jwt.GetValue("AccessTokenMinutes", 60));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.DisplayName),
        };

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}
