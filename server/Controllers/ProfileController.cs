using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using System.Security.Claims;

namespace server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProfileController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("owned")]
        public async Task<IActionResult> GetOwned(
            [FromQuery] string? search,
            [FromQuery] string? sortBy = "title",
            [FromQuery] string? order = "asc")
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var query = _context.Inventories
                .Where(i => i.OwnerId == userId)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(i =>
                    i.Title.ToLower().Contains(search.ToLower()));
            }

            query = (sortBy?.ToLower()) switch
            {
                "title" => order == "desc"
                    ? query.OrderByDescending(i => i.Title)
                    : query.OrderBy(i => i.Title),

                "created" => order == "desc"
                    ? query.OrderByDescending(i => i.Id)
                    : query.OrderBy(i => i.Id),

                _ => query.OrderBy(i => i.Title)
            };

            var result = await query
                .Select(i => new ProfileInventoryDto
                {
                    Id = i.Id,
                    Title = i.Title,
                    Description = i.Description,
                    IsPublic = i.IsPublic,
                    OwnerId = i.OwnerId,
                    InventoryTypeId = i.InventoryTypeId
                })
                .ToListAsync();

            return Ok(result);
        }

        [HttpGet("write-access")]
        public async Task<IActionResult> GetWriteAccess(
            [FromQuery] string? search,
            [FromQuery] string? sortBy = "title",
            [FromQuery] string? order = "asc")
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var query = _context.InventoryUserAccesses
                .Where(x => x.UserId == userId)
                .Select(x => x.Inventory)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(i =>
                    i.Title.ToLower().Contains(search.ToLower()));
            }

            query = (sortBy?.ToLower()) switch
            {
                "title" => order == "desc"
                    ? query.OrderByDescending(i => i.Title)
                    : query.OrderBy(i => i.Title),

                "created" => order == "desc"
                    ? query.OrderByDescending(i => i.Id)
                    : query.OrderBy(i => i.Id),

                _ => query.OrderBy(i => i.Title)
            };

            var result = await query
                .Select(i => new ProfileInventoryDto
                {
                    Id = i.Id,
                    Title = i.Title,
                    Description = i.Description,
                    IsPublic = i.IsPublic,
                    OwnerId = i.OwnerId,
                    InventoryTypeId = i.InventoryTypeId
                })
                .ToListAsync();

            return Ok(result);
        }
    }
}