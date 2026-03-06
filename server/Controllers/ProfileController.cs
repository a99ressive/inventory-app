using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
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
        public async Task<IActionResult> GetOwned()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var inventories = await _context.Inventories
                .Where(i => i.OwnerId == userId)
                .ToListAsync();

            return Ok(inventories);
        }

        [HttpGet("write-access")]
        public async Task<IActionResult> GetWriteAccess()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var inventories = await _context.InventoryUserAccesses
                .Where(x => x.UserId == userId)
                .Select(x => x.Inventory)
                .ToListAsync();

            return Ok(inventories);
        }
    }
}
