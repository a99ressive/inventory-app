namespace server.Models.CustomId
{
    public class CustomIdElement
    {
        public CustomIdElementType Type { get; set; }

        public string? Value { get; set; }

        public string? Format { get; set; }

        public int? Padding { get; set; }
    }
}
