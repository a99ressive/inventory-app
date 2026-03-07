using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;

namespace server.Controllers;

[ApiController]
[Route("api/inventory-types")]
public class InventoryTypesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public InventoryTypesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var types = await _context.InventoryTypes
            .OrderBy(t => t.Id)
            .Select(t => new
            {
                t.Id,
                Name = t.NameEn,
                t.Prefix
            })
            .ToListAsync();

        return Ok(types);
    }
}