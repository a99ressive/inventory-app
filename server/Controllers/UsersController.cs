using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using server.DTOs;
using server.Models;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;

    public UsersController(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<UserSearchDto>>> Search(
        [FromQuery] string query,
        [FromQuery] string sort = "name",
        [FromQuery] int limit = 10)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            return Ok(new List<UserSearchDto>());

        query = query.ToUpper();

        limit = Math.Clamp(limit, 1, 20);

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var usersQuery = _userManager.Users
            .Where(u =>
                u.Id != currentUserId &&
                (
                    u.NormalizedEmail!.StartsWith(query) ||
                    u.NormalizedUserName!.StartsWith(query)
                ));

        usersQuery = sort.ToLower() switch
        {
            "email" => usersQuery.OrderBy(u => u.Email),
            _ => usersQuery.OrderBy(u => u.UserName)
        };

        var users = await usersQuery
            .Take(limit)
            .Select(u => new UserSearchDto
            {
                Id = u.Id,
                Email = u.Email!,
                Name = u.UserName!
            })
            .ToListAsync();

        return Ok(users);
    }
}