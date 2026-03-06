namespace server.DTOs;

public class UpdateItemDto
{
    public string CustomId { get; set; } = string.Empty;

    public Dictionary<string, object>? Data { get; set; }

    public byte[] RowVersion { get; set; } = null!;
}