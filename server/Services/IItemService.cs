using server.DTOs;
using server.Models;
using System.Security.Claims;

namespace server.Services;

public interface IItemService
{
    Task<Item> CreateAsync(
        Guid inventoryId,
        CreateItemDto dto,
        string userId,
        ClaimsPrincipal user);

    Task<List<Item>> GetAllAsync(
        Guid inventoryId,
        string? userId,
        ClaimsPrincipal user);

    Task UpdateAsync(
        Guid inventoryId,
        Guid itemId,
        UpdateItemDto dto,
        string userId,
        ClaimsPrincipal user);

    Task DeleteAsync(
        Guid inventoryId,
        Guid itemId,
        string userId,
        ClaimsPrincipal user);
}