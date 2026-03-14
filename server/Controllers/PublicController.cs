using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using server.Data;
using server.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PublicController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PublicController> _logger;

    public PublicController(ApplicationDbContext context, ILogger<PublicController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("home")]
    public async Task<ActionResult<PublicHomeDto>> Home()
    {
        try
        {
            var itemCountsQuery = _context.Items
                .AsNoTracking()
                .GroupBy(i => i.InventoryId)
                .Select(g => new
                {
                    InventoryId = g.Key,
                    Count = (int?)g.Count()
                });

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
                    ItemCount = cnt != null ? (cnt.Count ?? 0) : 0
                };

            _logger.LogInformation("Выполняем запрос latestRaw...");
            var latestRaw = await baseQuery
                .OrderByDescending(x => x.Id)
                .Take(10)
                .ToListAsync();
            _logger.LogInformation("latestRaw загружен, записей: {Count}", latestRaw.Count);

            _logger.LogInformation("Выполняем запрос topRaw...");
            var topRaw = await baseQuery
                .OrderByDescending(x => x.ItemCount)
                .ThenBy(x => x.Title)
                .Take(5)
                .ToListAsync();
            _logger.LogInformation("topRaw загружен, записей: {Count}", topRaw.Count);

            var ids = latestRaw.Select(x => x.Id)
                .Concat(topRaw.Select(x => x.Id))
                .Distinct()
                .ToList();

            _logger.LogInformation("Выполняем запрос tagsByInventory...");
            var tagsByInventory = await _context.InventoryTags
                .AsNoTracking()
                .Where(t => ids.Contains(t.InventoryId))
                .GroupBy(t => t.InventoryId)
                .Select(g => new
                {
                    InventoryId = g.Key,
                    Tags = g.Select(x => x.Tag).Distinct().ToList()
                })
                .ToListAsync();
            _logger.LogInformation("tagsByInventory загружен, записей: {Count}", tagsByInventory.Count);

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

            _logger.LogInformation("Выполняем запрос tagCloud...");
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
            _logger.LogInformation("tagCloud загружен, записей: {Count}", tagCloud.Count);

            return Ok(new PublicHomeDto
            {
                Latest = latest,
                TopPopular = topPopular,
                TagCloud = tagCloud
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка в методе Home");
            return StatusCode(500, "Внутренняя ошибка сервера. Подробности в логах.");
        }
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<PublicInventoryRowDto>>> Search([FromQuery] string query)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query))
                return Ok(new List<PublicInventoryRowDto>());

            var tsQuery = EF.Functions.PlainToTsQuery("english", query.Trim());

            var itemCountsQuery = _context.Items
                .AsNoTracking()
                .GroupBy(i => i.InventoryId)
                .Select(g => new
                {
                    InventoryId = g.Key,
                    Count = (int?)g.Count()
                });

            _logger.LogInformation("Выполняем поисковый запрос с параметром: {Query}", query);
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
                    ItemCount = cnt != null ? (cnt.Count ?? 0) : 0
                })
                .Take(100)
                .ToListAsync();
            _logger.LogInformation("Поиск выполнен, найдено записей: {Count}", raw.Count);

            var ids = raw.Select(x => x.Id).ToList();

            _logger.LogInformation("Загружаем теги для найденных инвентарей...");
            var tagsByInventory = await _context.InventoryTags
                .AsNoTracking()
                .Where(t => ids.Contains(t.InventoryId))
                .GroupBy(t => t.InventoryId)
                .Select(g => new
                {
                    InventoryId = g.Key,
                    Tags = g.Select(x => x.Tag).Distinct().ToList()
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка в методе Search");
            return StatusCode(500, "Внутренняя ошибка сервера. Подробности в логах.");
        }
    }

    [HttpGet("tags/suggest")]
    public async Task<ActionResult<List<string>>> SuggestTags(
        [FromQuery] string startsWith,
        [FromQuery] int limit = 10)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(startsWith))
                return Ok(new List<string>());

            startsWith = startsWith.Trim().ToLowerInvariant();
            limit = Math.Clamp(limit, 1, 30);

            _logger.LogInformation("Выполняем подсказку тегов для: {StartsWith}", startsWith);
            var tags = await _context.InventoryTags
                .AsNoTracking()
                .Where(t => t.Tag.ToLower().StartsWith(startsWith))
                .GroupBy(t => t.Tag)
                .Select(g => g.Key)
                .OrderBy(t => t)
                .Take(limit)
                .ToListAsync();
            _logger.LogInformation("Найдено тегов: {Count}", tags.Count);

            return Ok(tags);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка в методе SuggestTags");
            return StatusCode(500, "Внутренняя ошибка сервера. Подробности в логах.");
        }
    }
}