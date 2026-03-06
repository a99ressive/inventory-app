namespace server.Models
{
    public class InventoryUserAccess
    {
        public Guid InventoryId { get; set; }
        public Inventory Inventory { get; set; } = null!;
        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;
    }
}
