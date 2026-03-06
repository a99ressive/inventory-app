namespace server.Models.CustomId
{
    public class CustomIdElement
    {
        public CustomIdElementType Type { get; set; }

        public string? Value { get; set; }   // FixedText

        public string? Format { get; set; }  // DateTime

        public int? Padding { get; set; }    // Sequence or numeric formatting
    }
}
