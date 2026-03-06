namespace server.DTOs;

public class UpdateInventoryDto : CreateInventoryDto
{
    public byte[] RowVersion { get; set; } = null!;
}