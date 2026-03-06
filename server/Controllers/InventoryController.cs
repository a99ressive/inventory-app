using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
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

    private string CurrentUserId =>
        User.FindFirst(ClaimTypes.NameIdentifier)!.Value;

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
        var result = await _service.GetAsync(id, CurrentUserId, User);
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, CreateInventoryDto dto)
    {
        await _service.UpdateAsync(id, dto, CurrentUserId, User);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.DeleteAsync(id, CurrentUserId, User);
        return NoContent();
    }

    [HttpPost("{inventoryId}/access/{userId}")]
    public async Task<IActionResult> AddAccess(Guid inventoryId, string userId)
    {
        await _service.AddAccessAsync(inventoryId, userId, CurrentUserId, User);
        return Ok();
    }

    [HttpDelete("{inventoryId}/access/{userId}")]
    public async Task<IActionResult> RemoveAccess(Guid inventoryId, string userId)
    {
        await _service.RemoveAccessAsync(inventoryId, userId, CurrentUserId, User);
        return Ok();
    }

    [HttpGet("{inventoryId}/access")]
    public async Task<IActionResult> GetAccess(Guid inventoryId)
    {
        var list = await _service.GetAccessListAsync(inventoryId, CurrentUserId, User);
        return Ok(list);
    }

    [HttpPut("{id}/fields")]
    public async Task<IActionResult> UpdateFields(Guid id, UpdateFieldsDto dto)
    {
        await _service.UpdateFieldsAsync(id, dto, CurrentUserId, User);
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
}