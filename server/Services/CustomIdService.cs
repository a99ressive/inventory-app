using server.Data;
using server.Models.CustomId;
using server.Services;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

public class CustomIdService : ICustomIdService
{
    private readonly ApplicationDbContext _context;

    public CustomIdService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<string> GenerateAsync(Guid inventoryId)
    {
        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        var inventory = await _context.Inventories
            .FromSqlRaw(
                @"SELECT * FROM ""Inventories"" 
                  WHERE ""Id"" = {0} 
                  FOR UPDATE", inventoryId)
            .FirstOrDefaultAsync();

        if (inventory == null)
            throw new Exception("Inventory not found");

        if (inventory.CustomIdConfig == null)
            throw new Exception("CustomId config not set");

        var config = JsonSerializer.Deserialize<CustomIdConfig>(
            inventory.CustomIdConfig.RootElement.GetRawText());

        if (config == null || config.Elements.Count == 0)
            throw new Exception("Invalid CustomId config");

        var now = DateTime.UtcNow;

        // Проверяем, есть ли элемент Sequence в конфигурации
        bool hasSequence = config.Elements.Any(e => e.Type == CustomIdElementType.Sequence);

        // Если есть Sequence, берём следующий номер, иначе просто 0 (не используется)
        int nextSequence = hasSequence ? inventory.LastSequence + 1 : 0;

        var parts = new List<string>();

        foreach (var element in config.Elements)
        {
            parts.Add(GenerateElement(element, nextSequence, now));
        }

        // Увеличиваем счётчик только если Sequence действительно присутствует
        if (hasSequence)
            inventory.LastSequence = nextSequence;

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return string.Concat(parts);
    }

    public string GeneratePreview(CustomIdConfig config, int currentSequence)
    {
        var now = DateTime.UtcNow;
        int previewSequence = currentSequence + 1; // Для предпросмотра показываем следующий

        var parts = new List<string>();

        foreach (var element in config.Elements)
        {
            parts.Add(GenerateElement(element, previewSequence, now));
        }

        return string.Concat(parts);
    }

    private string GenerateElement(
        CustomIdElement element,
        int sequence,
        DateTime now)
    {
        switch (element.Type)
        {
            case CustomIdElementType.FixedText:
                return element.Value ?? "";

            case CustomIdElementType.Sequence:
                var seqString = sequence.ToString();
                if (element.Padding.HasValue)
                    seqString = seqString.PadLeft(element.Padding.Value, '0');
                return seqString;

            case CustomIdElementType.Random6Digit:
                return Random.Shared.Next(100000, 1000000).ToString();

            case CustomIdElementType.Random9Digit:
                return Random.Shared.Next(100000000, 1000000000).ToString();

            case CustomIdElementType.Random20Bit:
                return Random.Shared.Next(1 << 20).ToString();

            case CustomIdElementType.Random32Bit:
                return Random.Shared.NextInt64(1L << 32).ToString();

            case CustomIdElementType.Guid:
                return Guid.NewGuid().ToString();

            case CustomIdElementType.DateTime:
                return now.ToString(element.Format ?? "yyyy");

            default:
                throw new Exception("Unknown element type");
        }
    }
}