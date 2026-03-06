using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PublicController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PublicController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("home")]
    public async Task<ActionResult<PublicHomeDto>> Home()
    {
        var itemCountsQuery = _context.Items
            .AsNoTracking()
            .GroupBy(i => i.InventoryId)
            .Select(g => new { InventoryId = g.Key, Count = g.Count() });

        var baseQuery =
            from inv in _context.Inventories.AsNoTracking()
            join owner in _context.Users.AsNoTracking() on inv.OwnerId equals owner.Id
            join cnt in itemCountsQuery on inv.Id equals cnt.InventoryId into cntLeft
            from cnt in cntLeft.DefaultIfEmpty()
            select new
            {
                inv.Id,
                inv.Title,
                inv.Description,
                OwnerName = owner.UserName ?? owner.Email ?? "unknown",
                ItemCount = cnt == null ? 0 : cnt.Count
            };

        var latestRaw = await baseQuery
            .OrderByDescending(x => x.Id)
            .Take(10)
            .ToListAsync();

        var topRaw = await baseQuery
            .OrderByDescending(x => x.ItemCount)
            .ThenBy(x => x.Title)
            .Take(5)
            .ToListAsync();

        var ids = latestRaw.Select(x => x.Id)
            .Concat(topRaw.Select(x => x.Id))
            .Distinct()
            .ToList();

        var tagsByInventory = await _context.InventoryTags
            .AsNoTracking()
            .Where(t => ids.Contains(t.InventoryId))
            .GroupBy(t => t.InventoryId)
            .Select(g => new
            {
                InventoryId = g.Key,
                Tags = g.Select(x => x.Tag).Distinct().OrderBy(x => x).ToList()
            })
            .ToListAsync();

        var tagsMap = tagsByInventory.ToDictionary(x => x.InventoryId, x => x.Tags);

        var latest = latestRaw.Select(x => new PublicInventoryRowDto
        {
            Id = x.Id,
            Title = x.Title,
            Description = x.Description,
            OwnerName = x.OwnerName,
            ItemCount = x.ItemCount,
            Tags = tagsMap.TryGetValue(x.Id, out var tags) ? tags : new List<string>()
        }).ToList();

        var topPopular = topRaw.Select(x => new PublicInventoryRowDto
        {
            Id = x.Id,
            Title = x.Title,
            Description = x.Description,
            OwnerName = x.OwnerName,
            ItemCount = x.ItemCount,
            Tags = tagsMap.TryGetValue(x.Id, out var tags) ? tags : new List<string>()
        }).ToList();

        var tagCloud = await _context.InventoryTags
            .AsNoTracking()
            .GroupBy(t => t.Tag)
            .Select(g => new TagCloudItemDto
            {
                Tag = g.Key,
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .ThenBy(x => x.Tag)
            .Take(40)
            .ToListAsync();

        return Ok(new PublicHomeDto
        {
            Latest = latest,
            TopPopular = topPopular,
            TagCloud = tagCloud
        });
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<PublicInventoryRowDto>>> Search([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return Ok(new List<PublicInventoryRowDto>());

        var tsQuery = EF.Functions.PlainToTsQuery("english", query.Trim());

        var itemCountsQuery = _context.Items
            .AsNoTracking()
            .GroupBy(i => i.InventoryId)
            .Select(g => new { InventoryId = g.Key, Count = g.Count() });

        var raw = await (
            from inv in _context.Inventories.AsNoTracking()
            where inv.SearchVector.Matches(tsQuery)
            join owner in _context.Users.AsNoTracking() on inv.OwnerId equals owner.Id
            join cnt in itemCountsQuery on inv.Id equals cnt.InventoryId into cntLeft
            from cnt in cntLeft.DefaultIfEmpty()
            orderby inv.Title
            select new
            {
                inv.Id,
                inv.Title,
                inv.Description,
                OwnerName = owner.UserName ?? owner.Email ?? "unknown",
                ItemCount = cnt == null ? 0 : cnt.Count
            })
            .Take(100)
            .ToListAsync();

        var ids = raw.Select(x => x.Id).ToList();

        var tagsByInventory = await _context.InventoryTags
            .AsNoTracking()
            .Where(t => ids.Contains(t.InventoryId))
            .GroupBy(t => t.InventoryId)
            .Select(g => new
            {
                InventoryId = g.Key,
                Tags = g.Select(x => x.Tag).Distinct().OrderBy(x => x).ToList()
            })
            .ToListAsync();

        var tagsMap = tagsByInventory.ToDictionary(x => x.InventoryId, x => x.Tags);

        var result = raw.Select(x => new PublicInventoryRowDto
        {
            Id = x.Id,
            Title = x.Title,
            Description = x.Description,
            OwnerName = x.OwnerName,
            ItemCount = x.ItemCount,
            Tags = tagsMap.TryGetValue(x.Id, out var tags) ? tags : new List<string>()
        }).ToList();

        return Ok(result);
    }

    [HttpGet("tags/suggest")]
    public async Task<ActionResult<List<string>>> SuggestTags([FromQuery] string startsWith, [FromQuery] int limit = 10)
    {
        if (string.IsNullOrWhiteSpace(startsWith))
            return Ok(new List<string>());

        startsWith = startsWith.Trim().ToLowerInvariant();
        limit = Math.Clamp(limit, 1, 30);

        var tags = await _context.InventoryTags
            .AsNoTracking()
            .Where(t => t.Tag.ToLower().StartsWith(startsWith))
            .GroupBy(t => t.Tag)
            .Select(g => g.Key)
            .OrderBy(t => t)
            .Take(limit)
            .ToListAsync();

        return Ok(tags);
    }
}