namespace server.Models;

public class Like
{
    public Guid Id { get; set; }

    public Guid ItemId { get; set; }

    public string UserId { get; set; } = null!;

    public Item Item { get; set; } = null!;

    public ApplicationUser User { get; set; } = null!;
}