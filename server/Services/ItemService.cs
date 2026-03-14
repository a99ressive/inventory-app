using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Models;
using server.Models.CustomId;
using System.Security.Claims;
using System.Text.Json;

namespace server.Services;

public class ItemService : IItemService
{
    private readonly ApplicationDbContext _context;
    private readonly ICustomIdService _customIdService;
    private readonly CustomIdValidationService _validationService;

    public ItemService(
        ApplicationDbContext context,
        ICustomIdService customIdService,
        CustomIdValidationService validationService)
    {
        _context = context;
        _customIdService = customIdService;
        _validationService = validationService;
    }

    public async Task<Item> CreateAsync(
        Guid inventoryId,
        CreateItemDto dto,
        string userId,
        ClaimsPrincipal user)
    {
        var inventory = await _context.Inventories
            .FirstOrDefaultAsync(i => i.Id == inventoryId)
            ?? throw new KeyNotFoundException("Inventory not found.");

        if (!await HasWriteAccess(inventory, userId, user))
            throw new UnauthorizedAccessException();

        ValidateItemData(inventory, dto.Data);

        const int maxAttempts = 3;
        for (int attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                var customId = await _customIdService.GenerateAsync(inventoryId);

                var item = new Item
                {
                    Id = Guid.NewGuid(),
                    InventoryId = inventoryId,
                    CustomId = customId,
                    Data = dto.Data != null
                        ? JsonDocument.Parse(JsonSerializer.Serialize(dto.Data))
                        : null!,
                    CreatedById = userId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Items.Add(item);
                await _context.SaveChangesAsync();
                return item;
            }
            catch (DbUpdateException ex) when (IsUniqueViolation(ex))
            {
                if (attempt == maxAttempts)
                    throw new InvalidOperationException("Failed to generate a unique Custom ID. Try again or set it manually.");
            }
        }

        throw new InvalidOperationException("Failed to create item.");
    }

    public async Task UpdateAsync(
        Guid inventoryId,
        Guid itemId,
        UpdateItemDto dto,
        string userId,
        ClaimsPrincipal user)
    {
        var item = await _context.Items
            .FirstOrDefaultAsync(i => i.Id == itemId)
            ?? throw new KeyNotFoundException("Item not found.");

        if (item.InventoryId != inventoryId)
            throw new InvalidOperationException("Item does not belong to this inventory.");

        var inventory = await _context.Inventories
            .FirstAsync(i => i.Id == inventoryId);

        if (!await HasWriteAccess(inventory, userId, user))
            throw new UnauthorizedAccessException();

        if (inventory.CustomIdConfig != null)
        {
            var config = JsonSerializer.Deserialize<CustomIdConfig>(
                inventory.CustomIdConfig.RootElement.GetRawText());
            if (config == null || !_validationService.IsValid(dto.CustomId, config))
                throw new InvalidOperationException("Custom ID does not match inventory format.");
        }

        bool duplicate = await _context.Items
            .AnyAsync(i => i.InventoryId == inventoryId && i.CustomId == dto.CustomId && i.Id != itemId);
        if (duplicate)
            throw new InvalidOperationException("Custom ID already exists in this inventory.");

        item.CustomId = dto.CustomId;
        item.Data = dto.Data != null
            ? JsonDocument.Parse(JsonSerializer.Serialize(dto.Data))
            : null!;

        _context.Entry(item).Property(x => x.RowVersion).OriginalValue = dto.RowVersion;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new DbUpdateConcurrencyException("Item was modified by another user.");
        }
    }

    public async Task<List<Item>> GetAllAsync(
        Guid inventoryId,
        string? userId,
        ClaimsPrincipal user)
    {
        var inventory = await _context.Inventories
            .FirstOrDefaultAsync(i => i.Id == inventoryId)
            ?? throw new KeyNotFoundException("Inventory not found.");

        if (!await HasReadAccess(inventory, userId, user))
            throw new UnauthorizedAccessException();

        return await _context.Items
            .Where(i => i.InventoryId == inventoryId)
            .ToListAsync();
    }

    public async Task DeleteAsync(
        Guid inventoryId,
        Guid itemId,
        string userId,
        ClaimsPrincipal user)
    {
        var item = await _context.Items
            .FirstOrDefaultAsync(i => i.Id == itemId)
            ?? throw new KeyNotFoundException("Item not found.");

        if (item.InventoryId != inventoryId)
            throw new InvalidOperationException("Item does not belong to this inventory.");

        var inventory = await _context.Inventories
            .FirstAsync(i => i.Id == inventoryId);

        if (!await HasWriteAccess(inventory, userId, user))
            throw new UnauthorizedAccessException();

        _context.Items.Remove(item);
        await _context.SaveChangesAsync();
    }

    private bool IsUniqueViolation(DbUpdateException ex)
    {
        return ex.InnerException?.Message.Contains("unique constraint") == true
            || ex.InnerException?.Message.Contains("duplicate key") == true;
    }

    private async Task<bool> HasReadAccess(
        Inventory inventory,
        string? userId,
        ClaimsPrincipal user)
    {
        if (inventory.IsPublic)
            return true;

        if (inventory.OwnerId == userId)
            return true;

        if (user.IsInRole("Admin"))
            return true;

        if (userId == null)
            return false;

        return await _context.InventoryUserAccesses
            .AnyAsync(x =>
                x.InventoryId == inventory.Id &&
                x.UserId == userId);
    }

    private async Task<bool> HasWriteAccess(
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

    private void ValidateItemData(
        Inventory inventory,
        Dictionary<string, object>? data)
    {
        if (inventory.CustomFields == null || data == null)
            return;

        var fields = JsonSerializer.Deserialize<List<CustomFieldDto>>(
            inventory.CustomFields.RootElement.GetRawText());

        foreach (var field in fields!)
        {
            if (!data.ContainsKey(field.Title))
                throw new InvalidOperationException($"Missing field {field.Title}.");
        }
    }
}



    
