using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.DTOs;
using server.Services;
using System.Security.Claims;

namespace server.Controllers;

[ApiController]
[Route("api/inventory/{inventoryId}/items")]
[Authorize]
public class ItemController : ControllerBase
{
    private readonly IItemService _itemService;

    public ItemController(IItemService itemService)
    {
        _itemService = itemService;
    }

    private string? CurrentUserIdOrNull =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    private string CurrentUserId =>
        CurrentUserIdOrNull ?? throw new UnauthorizedAccessException();

    [HttpPost]
    public async Task<IActionResult> Create(Guid inventoryId, CreateItemDto dto)
    {
        try
        {
            var result = await _itemService.CreateAsync(
                inventoryId,
                dto,
                CurrentUserId,
                User
            );

            return Ok(result);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict("Item was modified by another user.");
        }
        catch (DbUpdateException)
        {
            return Conflict("CustomId must be unique within inventory.");
        }
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(Guid inventoryId)
    {
        var items = await _itemService.GetAllAsync(
            inventoryId,
            CurrentUserIdOrNull,
            User
        );

        return Ok(items);
    }

    [HttpPut("{itemId}")]
    public async Task<IActionResult> Update(
        Guid inventoryId,
        Guid itemId,
        UpdateItemDto dto)
    {
        try
        {
            await _itemService.UpdateAsync(
                inventoryId,
                itemId,
                dto,
                CurrentUserId,
                User
            );

            return NoContent();
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict("Item was modified by another user.");
        }
        catch (DbUpdateException)
        {
            return Conflict("CustomId must be unique within inventory.");
        }
    }

    [HttpDelete("{itemId}")]
    public async Task<IActionResult> Delete(
        Guid inventoryId,
        Guid itemId)
    {
        await _itemService.DeleteAsync(
            inventoryId,
            itemId,
            CurrentUserId,
            User
        );

        return NoContent();
    }
}
