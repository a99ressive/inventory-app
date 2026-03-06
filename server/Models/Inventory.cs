using server.Models;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using NpgsqlTypes;

namespace server.Models;

public class Inventory
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsPublic { get; set; }

    public string OwnerId { get; set; } = string.Empty;

    public ApplicationUser Owner { get; set; } = null!;

    public int InventoryTypeId { get; set; }

    public InventoryType InventoryType { get; set; } = null!;

    // 🔥 NEW: Custom ID configuration
    public JsonDocument? CustomIdConfig { get; set; }

    // 🔥 NEW: sequence counter
    public int LastSequence { get; set; } = 0;

    public JsonDocument? CustomFields { get; set; }

    public NpgsqlTsVector SearchVector { get; set; } = null!;

    [Timestamp]
    public byte[]? RowVersion { get; set; }
}