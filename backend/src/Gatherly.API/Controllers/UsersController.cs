using Gatherly.API.Extensions;
using Gatherly.Application.Auth;
using Gatherly.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Gatherly.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController(UserManager<ApplicationUser> userManager) : ControllerBase
{
    [HttpGet("me")]
    public async Task<ActionResult<UserProfileDto>> GetMe()
    {
        var user = await userManager.FindByIdAsync(User.GetUserId()!);
        if (user is null) return Unauthorized();
        return new UserProfileDto(user.Id, user.Email ?? string.Empty, user.DisplayName, user.Bio, user.AvatarUrl);
    }

    [HttpPut("me")]
    public async Task<ActionResult<UserProfileDto>> UpdateMe(UpdateProfileRequest request)
    {
        var user = await userManager.FindByIdAsync(User.GetUserId()!);
        if (user is null) return Unauthorized();

        if (request.DisplayName is not null) user.DisplayName = request.DisplayName;
        if (request.Bio is not null) user.Bio = request.Bio;
        if (request.AvatarUrl is not null) user.AvatarUrl = request.AvatarUrl;

        await userManager.UpdateAsync(user);
        return new UserProfileDto(user.Id, user.Email ?? string.Empty, user.DisplayName, user.Bio, user.AvatarUrl);
    }
}
