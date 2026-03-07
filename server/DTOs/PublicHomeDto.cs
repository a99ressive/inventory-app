namespace server.DTOs;

public class PublicInventoryRowDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public int ItemCount { get; set; }
}

public class PublicHomeDto
{
    public List<PublicInventoryRowDto> Latest { get; set; } = new();
    public List<PublicInventoryRowDto> TopPopular { get; set; } = new();
}