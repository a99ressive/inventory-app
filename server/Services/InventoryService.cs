using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Models;
using server.Models.CustomId;
using server.Models.Enums;
using System.Security.Claims;
using System.Text.Json;

namespace server.Services;

public class InventoryService : IInventoryService
{
    private readonly ApplicationDbContext _context;

    public InventoryService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> CreateAsync(CreateInventoryDto dto, string userId)
    {
        var typeExists = await _context.InventoryTypes
            .AnyAsync(t => t.Id == dto.InventoryTypeId);

        if (!typeExists)
            throw new InvalidOperationException("Invalid inventory type.");

        var defaultConfig = new CustomIdConfig
        {
            Elements = new List<CustomIdElement>
            {
                new CustomIdElement { Type = CustomIdElementType.Sequence, Padding = 4 }
            }
        };

        var inventory = new Inventory
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Description = dto.Description,
            InventoryTypeId = dto.InventoryTypeId,
            OwnerId = userId,
            IsPublic = dto.IsPublic,
            CustomIdConfig = JsonDocument.Parse(JsonSerializer.Serialize(defaultConfig)),
            LastSequence = 0,
            CustomFields = null // ???? ??? ?????
        };

        inventory.Tags = NormalizeTags(dto.Tags)
            .Select(tag => new InventoryTag
            {
                Id = Guid.NewGuid(),
                InventoryId = inventory.Id,
                Tag = tag
            })
            .ToList();

        _context.Inventories.Add(inventory);
        await _context.SaveChangesAsync();

        return inventory.Id;
    }

    public async Task UpdateAsync(Guid id, CreateInventoryDto dto, string userId, ClaimsPrincipal user)
    {
        var inventory = await _context.Inventories
            .FirstOrDefaultAsync(i => i.Id == id)
            ?? throw new KeyNotFoundException("Inventory not found.");

        if (!HasOwnerRights(inventory, userId, user))
            throw new UnauthorizedAccessException();

        // ????????? ????
        inventory.Title = dto.Title;
        inventory.Description = dto.Description;
        inventory.InventoryTypeId = dto.InventoryTypeId;
        inventory.IsPublic = dto.IsPublic;

        await _context.Entry(inventory).Collection(i => i.Tags).LoadAsync();
        inventory.Tags.Clear();

        foreach (var tag in NormalizeTags(dto.Tags))
        {
            inventory.Tags.Add(new InventoryTag
            {
                Id = Guid.NewGuid(),
                InventoryId = inventory.Id,
                Tag = tag
            });
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new DbUpdateConcurrencyException("Inventory was modified by another user.");
        }
    }

    public async Task<Inventory> UpdateWithVersionAsync(Guid id, UpdateInventoryDto dto, string userId, ClaimsPrincipal user)
    {
        var inventory = await _context.Inventories
            .FirstOrDefaultAsync(i => i.Id == id)
            ?? throw new KeyNotFoundException("Inventory not found.");

        if (!HasOwnerRights(inventory, userId, user))
            throw new UnauthorizedAccessException();

        inventory.Title = dto.Title;
        inventory.Description = dto.Description;
        inventory.InventoryTypeId = dto.InventoryTypeId;
        inventory.IsPublic = dto.IsPublic;

        _context.Entry(inventory).Property(x => x.RowVersion).OriginalValue = dto.RowVersion;

        try
        {
            await _context.SaveChangesAsync();
            return inventory;
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new DbUpdateConcurrencyException("Inventory was modified by another user.");
        }
    }

    public async Task UpdateFieldsAsync(Guid id, UpdateFieldsDto dto, string userId, ClaimsPrincipal user)
    {
        var inventory = await _context.Inventories
            .FirstOrDefaultAsync(i => i.Id == id)
            ?? throw new KeyNotFoundException("Inventory not found.");

        if (!HasOwnerRights(inventory, userId, user))
            throw new UnauthorizedAccessException();

        ValidateFieldLimits(dto.Fields);

        inventory.CustomFields =
            JsonDocument.Parse(JsonSerializer.Serialize(dto.Fields));

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new DbUpdateConcurrencyException("Inventory was modified by another user.");
        }
    }

    public async Task<List<Inventory>> GetMineAsync(string userId)
    {
        return await _context.Inventories
            .Where(i => i.OwnerId == userId)
            .ToListAsync();
    }

    public async Task<Inventory> GetAsync(Guid id, string? userId, ClaimsPrincipal user)
    {
        var inventory = await _context.Inventories
            .Include(i => i.InventoryType)
            .FirstOrDefaultAsync(i => i.Id == id)
            ?? throw new KeyNotFoundException("Inventory not found.");

        if (!await HasReadAccess(inventory, userId, user))
            throw new UnauthorizedAccessException();

        inventory.CanWrite = userId != null && await HasWriteAccess(inventory, userId, user);

        return inventory;
    }

    public async Task DeleteAsync(Guid id, string userId, ClaimsPrincipal user)
    {
        var inventory = await _context.Inventories
            .FirstOrDefaultAsync(i => i.Id == id)
            ?? throw new KeyNotFoundException("Inventory not found.");

        if (!HasOwnerRights(inventory, userId, user))
            throw new UnauthorizedAccessException();

        _context.Inventories.Remove(inventory);
        await _context.SaveChangesAsync();
    }

    public async Task AddAccessAsync(Guid inventoryId, string targetUserId, string userId, ClaimsPrincipal user)
    {
        var inventory = await _context.Inventories
            .FirstOrDefaultAsync(i => i.Id == inventoryId)
            ?? throw new KeyNotFoundException("Inventory not found.");

        if (!HasOwnerRights(inventory, userId, user))
            throw new UnauthorizedAccessException();

        if (targetUserId == inventory.OwnerId)
            return;

        var exists = await _context.InventoryUserAccesses
            .AnyAsync(x => x.InventoryId == inventoryId && x.UserId == targetUserId);

        if (!exists)
        {
            _context.InventoryUserAccesses.Add(new InventoryUserAccess
            {
                InventoryId = inventoryId,
                UserId = targetUserId
            });

            await _context.SaveChangesAsync();
        }
    }

    public async Task RemoveAccessAsync(Guid inventoryId, string targetUserId, string userId, ClaimsPrincipal user)
    {
        var inventory = await _context.Inventories
            .FirstOrDefaultAsync(i => i.Id == inventoryId)
            ?? throw new KeyNotFoundException("Inventory not found.");

        if (!HasOwnerRights(inventory, userId, user))
            throw new UnauthorizedAccessException();

        if (targetUserId == inventory.OwnerId)
            return;

        var access = await _context.InventoryUserAccesses
            .FirstOrDefaultAsync(x => x.InventoryId == inventoryId && x.UserId == targetUserId);

        if (access != null)
        {
            _context.InventoryUserAccesses.Remove(access);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<UserSearchDto>> GetAccessListAsync(
    Guid inventoryId,
    string userId,
    ClaimsPrincipal user,
    string sortBy = "name")
    {
        var inventory = await _context.Inventories
            .FirstOrDefaultAsync(i => i.Id == inventoryId)
            ?? throw new KeyNotFoundException("Inventory not found.");

        if (!HasOwnerRights(inventory, userId, user))
            throw new UnauthorizedAccessException();

        var query = _context.InventoryUserAccesses
            .Where(x => x.InventoryId == inventoryId)
            .Join(
                _context.Users,
                access => access.UserId,
                u => u.Id,
                (access, u) => new UserSearchDto
                {
                    Id = u.Id,
                    Email = u.Email ?? string.Empty,
                    Name = u.UserName ?? string.Empty
                })
            .Where(x => x.Id != inventory.OwnerId);

        query = sortBy.ToLower() switch
        {
            "email" => query.OrderBy(x => x.Email),
            _ => query.OrderBy(x => x.Name)
        };

        return await query.ToListAsync();
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

    private async Task<bool> HasReadAccess(
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

    private bool HasOwnerRights(Inventory inventory, string userId, ClaimsPrincipal user)
    {
        return inventory.OwnerId == userId || user.IsInRole("Admin");
    }

    private void ValidateFieldLimits(List<CustomFieldDto> fields)
    {
        if (fields.Count(f => f.Type == "string") > 3)
            throw new InvalidOperationException("Max 3 single-line fields.");

        if (fields.Count(f => f.Type == "text") > 3)
            throw new InvalidOperationException("Max 3 multi-line fields.");

        if (fields.Count(f => f.Type == "number") > 3)
            throw new InvalidOperationException("Max 3 numeric fields.");

        if (fields.Count(f => f.Type == "boolean") > 3)
            throw new InvalidOperationException("Max 3 boolean fields.");

        if (fields.Count(f => f.Type == "link") > 3)
            throw new InvalidOperationException("Max 3 link fields.");
    }

    private static List<string> NormalizeTags(IEnumerable<string>? tags)
    {
        if (tags == null) return new List<string>();

        return tags
            .Select(t => (t ?? string.Empty).Trim())
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Select(t => t.Length > 100 ? t[..100] : t)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(50)
            .ToList();
    }
}

