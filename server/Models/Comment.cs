using System.ComponentModel.DataAnnotations;

namespace server.Models;

public class Comment
{
    public Guid Id { get; set; }

    public Guid InventoryId { get; set; }

    public string UserId { get; set; } = null!;

    [Required]
    public string Content { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public Inventory Inventory { get; set; } = null!;

    public ApplicationUser User { get; set; } = null!;
}