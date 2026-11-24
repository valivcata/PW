using FluentValidation;
using Gatherly.Application.Auth;
using Gatherly.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Gatherly.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    UserManager<ApplicationUser> userManager,
    ITokenService tokenService,
    IValidator<RegisterRequest> registerValidator) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var validation = await registerValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
            return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName,
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        var (token, expires) = tokenService.CreateAccessToken(user);
        return Ok(new AuthResponse(token, expires, ToProfile(user)));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || !await userManager.CheckPasswordAsync(user, request.Password))
            return Unauthorized(new { error = "Invalid email or password." });

        var (token, expires) = tokenService.CreateAccessToken(user);
        return Ok(new AuthResponse(token, expires, ToProfile(user)));
    }

    private static UserProfileDto ToProfile(ApplicationUser u) =>
        new(u.Id, u.Email ?? string.Empty, u.DisplayName, u.Bio, u.AvatarUrl);
}
