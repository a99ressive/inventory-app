using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Models;
using server.Models.CustomId;
using server.Services;
using System.Security.Claims;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _service;
    private readonly ApplicationDbContext _context;
    private readonly ICustomIdService _customIdService;

    public InventoryController(
        IInventoryService service,
        ApplicationDbContext context,
        ICustomIdService customIdService)
    {
        _service = service;
        _context = context;
        _customIdService = customIdService;
    }

    private string? CurrentUserIdOrNull =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    private string CurrentUserId =>
        CurrentUserIdOrNull ?? throw new UnauthorizedAccessException();

    [HttpPost]
    public async Task<IActionResult> Create(CreateInventoryDto dto)
    {
        var id = await _service.CreateAsync(dto, CurrentUserId);
        return Ok(id);
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine()
    {
        var result = await _service.GetMineAsync(CurrentUserId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> Get(Guid id)
    {
        var result = await _service.GetAsync(
            id,
            CurrentUserIdOrNull,
            User
        );

        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, UpdateInventoryDto dto)
    {
        try
        {
            var updated = await _service.UpdateWithVersionAsync(
                id,
                dto,
                CurrentUserId,
                User
            );

            return Ok(new
            {
                updated.RowVersion
            });
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict("Inventory was modified by another user. Refresh and try again.");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.DeleteAsync(
            id,
            CurrentUserId,
            User
        );

        return NoContent();
    }

    [HttpPost("{inventoryId}/access/{userId}")]
    public async Task<IActionResult> AddAccess(Guid inventoryId, string userId)
    {
        await _service.AddAccessAsync(
            inventoryId,
            userId,
            CurrentUserId,
            User
        );

        return Ok();
    }

    [HttpDelete("{inventoryId}/access/{userId}")]
    public async Task<IActionResult> RemoveAccess(Guid inventoryId, string userId)
    {
        await _service.RemoveAccessAsync(
            inventoryId,
            userId,
            CurrentUserId,
            User
        );

        return Ok();
    }

    [HttpGet("{inventoryId}/access")]
    public async Task<IActionResult> GetAccess(
        Guid inventoryId,
        [FromQuery] string sortBy = "name")
    {
        var list = await _service.GetAccessListAsync(
            inventoryId,
            CurrentUserId,
            User,
            sortBy
        );

        return Ok(list);
    }

    [HttpPut("{id}/fields")]
    public async Task<IActionResult> UpdateFields(Guid id, UpdateFieldsDto dto)
    {
        await _service.UpdateFieldsAsync(
            id,
            dto,
            CurrentUserId,
            User
        );

        return NoContent();
    }

    [HttpPost("{inventoryId}/custom-id/preview")]
    public async Task<IActionResult> Preview(
        Guid inventoryId,
        [FromBody] CustomIdConfig config)
    {
        var inventory = await _context.Inventories
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == inventoryId);

        if (inventory == null)
            return NotFound();

        var preview = _customIdService.GeneratePreview(
            config,
            inventory.LastSequence);

        return Ok(preview);
    }

    [HttpGet("{inventoryId}/comments")]
    [AllowAnonymous]
    public async Task<IActionResult> GetComments(
        Guid inventoryId,
        [FromQuery] DateTime? after = null)
    {
        var inventory = await _context.Inventories
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == inventoryId);

        if (inventory == null)
            return NotFound();

        if (!await HasReadAccessAsync(inventory, CurrentUserIdOrNull, User))
            return Forbid();

        var query = _context.Comments
            .AsNoTracking()
            .Where(c => c.InventoryId == inventoryId);

        if (after.HasValue)
            query = query.Where(c => c.CreatedAt > after.Value);

        var comments = await query
            .OrderBy(c => c.CreatedAt)
            .Join(
                _context.Users.AsNoTracking(),
                c => c.UserId,
                u => u.Id,
                (c, u) => new CommentDto
                {
                    Id = c.Id,
                    InventoryId = c.InventoryId,
                    UserId = c.UserId,
                    UserName = u.UserName ?? u.Email ?? "unknown",
                    Content = c.Content,
                    CreatedAt = c.CreatedAt
                })
            .ToListAsync();

        return Ok(comments);
    }

    [HttpPost("{inventoryId}/comments")]
    public async Task<IActionResult> PostComment(
        Guid inventoryId,
        CreateCommentDto dto)
    {
        var content = dto.Content?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(content))
            return BadRequest("Comment content is required.");

        if (content.Length > 5000)
            return BadRequest("Comment is too long.");

        var inventory = await _context.Inventories
            .FirstOrDefaultAsync(x => x.Id == inventoryId);

        if (inventory == null)
            return NotFound();

        if (!await HasCommentAccessAsync(inventory, CurrentUserId, User))
            return Forbid();

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            InventoryId = inventoryId,
            UserId = CurrentUserId,
            Content = content,
            CreatedAt = DateTime.UtcNow
        };

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        var userName = User.FindFirstValue(ClaimTypes.Name) ?? "unknown";

        return Ok(new CommentDto
        {
            Id = comment.Id,
            InventoryId = comment.InventoryId,
            UserId = comment.UserId,
            UserName = userName,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt
        });
    }

    private async Task<bool> HasReadAccessAsync(
        Inventory inventory,
        string? userId,
        ClaimsPrincipal user)
    {
        if (inventory.IsPublic)
            return true;

        if (userId == null)
            return false;

        if (inventory.OwnerId == userId)
            return true;

        if (user.IsInRole("Admin"))
            return true;

        return await _context.InventoryUserAccesses
            .AnyAsync(x =>
                x.InventoryId == inventory.Id &&
                x.UserId == userId);
    }

    private async Task<bool> HasCommentAccessAsync(
        Inventory inventory,
        string userId,
        ClaimsPrincipal user)
    {
        if (inventory.OwnerId == userId)
            return true;

        if (user.IsInRole("Admin"))
            return true;

        if (inventory.IsPublic)
            return true;

        return await _context.InventoryUserAccesses
            .AnyAsync(x =>
                x.InventoryId == inventory.Id &&
                x.UserId == userId);
    }
}
