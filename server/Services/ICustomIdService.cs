using server.Models.CustomId;

namespace server.Services
{
    public interface ICustomIdService
    {
        Task<string> GenerateAsync(Guid inventoryId);

        string GeneratePreview(
            CustomIdConfig config,
            int currentSequence);
    }
}