using FluentValidation;
using Gatherly.Application.Auth;

namespace Gatherly.Application.Events;

public class CreateEventRequestValidator : AbstractValidator<CreateEventRequest>
{
    public CreateEventRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(4000);
        RuleFor(x => x.VenueName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Address).NotEmpty().MaximumLength(300);
        RuleFor(x => x.EndUtc).GreaterThan(x => x.StartUtc);
        RuleFor(x => x.StartUtc).GreaterThan(DateTime.UtcNow);
        RuleFor(x => x.Capacity).GreaterThan(0).When(x => x.Capacity.HasValue);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0).When(x => x.Price.HasValue);
        RuleFor(x => x.ImageUrl).MaximumLength(1000);
    }
}

public class UpdateEventRequestValidator : AbstractValidator<UpdateEventRequest>
{
    public UpdateEventRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(4000);
        RuleFor(x => x.VenueName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Address).NotEmpty().MaximumLength(300);
        RuleFor(x => x.EndUtc).GreaterThan(x => x.StartUtc);
        RuleFor(x => x.Capacity).GreaterThan(0).When(x => x.Capacity.HasValue);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0).When(x => x.Price.HasValue);
        RuleFor(x => x.ImageUrl).MaximumLength(1000);
    }
}

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).MinimumLength(8);
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(100);
    }
}
