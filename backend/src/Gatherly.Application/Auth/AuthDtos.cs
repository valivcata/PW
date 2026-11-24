namespace Gatherly.Application.Auth;

public record RegisterRequest(string Email, string Password, string DisplayName);
public record LoginRequest(string Email, string Password);
public record AuthResponse(string AccessToken, DateTime ExpiresAtUtc, UserProfileDto User);

public record UserProfileDto(
    string Id,
    string Email,
    string DisplayName,
    string? Bio,
    string? AvatarUrl);

public record UpdateProfileRequest(string? DisplayName, string? Bio, string? AvatarUrl);
