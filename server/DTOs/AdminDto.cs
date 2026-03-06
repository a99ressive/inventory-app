namespace server.DTOs;

public class AdminUserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public bool IsBlocked { get; set; }
    public bool IsAdmin { get; set; }
}

public class BlockUserDto
{
    public bool IsBlocked { get; set; }
}