using Microsoft.AspNetCore.Identity;

namespace server.Models;

public class ApplicationUser : IdentityUser
{
    public bool IsBlocked { get; set; } = false;
}