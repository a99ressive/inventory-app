using server.DTOs;
using server.Models;
using System.Security.Claims;

namespace server.Services;

public interface IInventoryService
{
    Task<Guid> CreateAsync(CreateInventoryDto dto, string userId);

    Task<List<Inventory>> GetMineAsync(string userId);

    Task<Inventory> GetAsync(Guid id, string? userId, ClaimsPrincipal user);

    Task UpdateAsync(Guid id, CreateInventoryDto dto, string userId, ClaimsPrincipal user);

    Task DeleteAsync(Guid id, string userId, ClaimsPrincipal user);

    Task AddAccessAsync(Guid inventoryId, string targetUserId, string userId, ClaimsPrincipal user);

    Task RemoveAccessAsync(Guid inventoryId, string targetUserId, string userId, ClaimsPrincipal user);

    Task<List<UserSearchDto>> GetAccessListAsync(
        Guid inventoryId,
        string userId,
        ClaimsPrincipal user,
        string sortBy = "name");

    Task UpdateFieldsAsync(Guid id, UpdateFieldsDto dto, string userId, ClaimsPrincipal user);

    Task UpdateWithVersionAsync(Guid id, UpdateInventoryDto dto, string userId, ClaimsPrincipal user);
}