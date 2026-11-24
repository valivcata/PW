using Gatherly.Application.Auth;
using Gatherly.Application.Events;

namespace Gatherly.UnitTests.Events;

public class RegisterRequestValidatorTests
{
    private readonly RegisterRequestValidator _validator = new();

    private static RegisterRequest Valid() => new("me@test.ro", "Password1", "Valentin");

    [Fact]
    public void Valid_request_passes()
    {
        Assert.True(_validator.Validate(Valid()).IsValid);
    }

    [Theory]
    [InlineData("not-an-email")]
    [InlineData("")]
    [InlineData("@no-local.com")]
    public void Bad_email_fails(string email)
    {
        var result = _validator.Validate(Valid() with { Email = email });
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Email");
    }

    [Fact]
    public void Short_password_fails()
    {
        var result = _validator.Validate(Valid() with { Password = "short" });
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Password");
    }

    [Fact]
    public void Empty_display_name_fails()
    {
        var result = _validator.Validate(Valid() with { DisplayName = "" });
        Assert.False(result.IsValid);
    }
}
