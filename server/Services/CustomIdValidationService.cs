using server.Models.CustomId;
using System.Text.RegularExpressions;

namespace server.Services
{
    public class CustomIdValidationService
    {
        public string BuildRegex(CustomIdConfig config)
        {
            var parts = new List<string>();

            foreach (var element in config.Elements)
            {
                parts.Add(GetPattern(element));
            }

            return "^" + string.Concat(parts) + "$";
        }

        public bool IsValid(string customId, CustomIdConfig config)
        {
            if (config == null || config.Elements.Count == 0)
                return false;

            var pattern = BuildRegex(config);
            return Regex.IsMatch(customId, pattern);
        }

        private string GetPattern(CustomIdElement element)
        {
            return element.Type switch
            {
                CustomIdElementType.FixedText =>
                    Regex.Escape(element.Value ?? ""),

                CustomIdElementType.Sequence =>
                    element.Padding.HasValue
                        ? $@"\d{{{element.Padding.Value}}}"
                        : @"\d+",

                CustomIdElementType.Random6Digit =>
                    @"\d{6}",

                CustomIdElementType.Random9Digit =>
                    @"\d{9}",

                CustomIdElementType.Random20Bit =>
                    @"\d+",

                CustomIdElementType.Random32Bit =>
                    @"\d+",

                CustomIdElementType.Guid =>
                    @"[0-9a-fA-F\-]{36}",

                CustomIdElementType.DateTime =>
                    @".+?",

                _ =>
                    throw new InvalidOperationException("Unknown Custom ID element type.")
            };
        }
    }
}
