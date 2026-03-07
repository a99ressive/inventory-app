namespace server.DTOs;

public class CommentDto
{
    public Guid Id { get; set; }

    public Guid InventoryId { get; set; }

    public string UserId { get; set; } = string.Empty;

    public string UserName { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}
