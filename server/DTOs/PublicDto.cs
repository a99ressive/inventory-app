namespace server.DTOs;

public class PublicInventoryRowDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public int ItemCount { get; set; }
    public List<string> Tags { get; set; } = new();
}

public class TagCloudItemDto
{
    public string Tag { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class PublicHomeDto
{
    public List<PublicInventoryRowDto> Latest { get; set; } = new();
    public List<PublicInventoryRowDto> TopPopular { get; set; } = new();
    public List<TagCloudItemDto> TagCloud { get; set; } = new();
}