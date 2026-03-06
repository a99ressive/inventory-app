namespace server.DTOs
{
    public class ProfileInventoryDto
    {
        public Guid Id { get; set; }

        public string Title { get; set; } = null!;

        public string? Description { get; set; }

        public bool IsPublic { get; set; }

        public string OwnerId { get; set; } = null!;

        public int InventoryTypeId { get; set; }
    }
}
