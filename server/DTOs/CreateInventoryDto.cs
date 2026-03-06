namespace server.DTOs;

public class CreateInventoryDto
{
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int InventoryTypeId { get; set; }

    public bool IsPublic { get; set; }
}