using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace server.Models;

public class Item
{
    public Guid Id { get; set; }

    public Guid InventoryId { get; set; }

    public Inventory Inventory { get; set; } = null!;

    public string CustomId { get; set; } = null!;

    public JsonDocument Data { get; set; } = null!;

    public string CreatedById { get; set; } = string.Empty;

    public ApplicationUser CreatedBy { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    [Timestamp]
    public byte[]? RowVersion { get; set; }
}