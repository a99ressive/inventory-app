public class UpdateFieldsDto
{
    public List<CustomFieldDto> Fields { get; set; } = new();
}

public class CustomFieldDto
{
    public string Type { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public bool ShowInTable { get; set; }
}