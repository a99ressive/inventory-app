using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Models;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;

    public AdminController(UserManager<ApplicationUser> userManager, ApplicationDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    [HttpGet("users")]
    public async Task<ActionResult<List<AdminUserDto>>> GetUsers(
        [FromQuery] string? query = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var q = _userManager.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(query))
        {
            var normalized = query.Trim().ToUpper();
            q = q.Where(u =>
                u.NormalizedEmail!.Contains(normalized) ||
                u.NormalizedUserName!.Contains(normalized));
        }

        var users = await q
            .OrderBy(u => u.UserName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var userIds = users.Select(u => u.Id).ToList();

        var adminRoleUserIds = await (
            from userRole in _context.UserRoles.AsNoTracking()
            join role in _context.Roles.AsNoTracking() on userRole.RoleId equals role.Id
            where role.Name == "Admin" && userIds.Contains(userRole.UserId)
            select userRole.UserId
        ).Distinct().ToListAsync();

        var adminUserIdSet = adminRoleUserIds.ToHashSet();

        var result = users.Select(u => new AdminUserDto
        {
            Id = u.Id,
            Email = u.Email ?? string.Empty,
            UserName = u.UserName ?? string.Empty,
            IsBlocked = u.IsBlocked,
            IsAdmin = adminUserIdSet.Contains(u.Id)
        }).ToList();

        return Ok(result);
    }

    [HttpPost("users/{userId}/block")]
    public async Task<IActionResult> SetBlock(string userId, [FromBody] BlockUserDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        user.IsBlocked = dto.IsBlocked;
        var updateResult = await _userManager.UpdateAsync(user);

        if (!updateResult.Succeeded)
            return BadRequest(updateResult.Errors);

        return NoContent();
    }

    [HttpPost("users/{userId}/admin")]
    public async Task<IActionResult> GrantAdmin(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        if (!await _userManager.IsInRoleAsync(user, "Admin"))
        {
            var r = await _userManager.AddToRoleAsync(user, "Admin");
            if (!r.Succeeded) return BadRequest(r.Errors);
        }

        return NoContent();
    }

    [HttpDelete("users/{userId}/admin")]
    public async Task<IActionResult> RevokeAdmin(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        if (await _userManager.IsInRoleAsync(user, "Admin"))
        {
            var r = await _userManager.RemoveFromRoleAsync(user, "Admin");
            if (!r.Succeeded) return BadRequest(r.Errors);
        }

        // Self-demote разрешён по ТЗ.
        return NoContent();
    }

    [HttpDelete("users/{userId}")]
    public async Task<IActionResult> DeleteUser(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        var r = await _userManager.DeleteAsync(user);
        if (!r.Succeeded) return BadRequest(r.Errors);

        return NoContent();
    }
}