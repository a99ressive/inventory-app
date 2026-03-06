namespace server.Models;

public class InventoryTag
{
    public Guid Id { get; set; }

    public Guid InventoryId { get; set; }

    public Inventory Inventory { get; set; } = null!;

    public string Tag { get; set; } = string.Empty;
}