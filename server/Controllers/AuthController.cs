using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using server.DTOs;
using server.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;
    private readonly SignInManager<ApplicationUser> _signInManager;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
    {
        var email = dto.Email.Trim();
        var password = dto.Password;

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email
        };

        var result = await _userManager.CreateAsync(user, password);

        if (!result.Succeeded)
            return BadRequest(result.Errors);

        if (!await _userManager.IsInRoleAsync(user, "User"))
        {
            var roleResult = await _userManager.AddToRoleAsync(user, "User");
            if (!roleResult.Succeeded)
                return BadRequest(roleResult.Errors);
        }

        return Ok();
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        var email = dto.Email.Trim();
        var password = dto.Password;

        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
            return Unauthorized();

        if (user.IsBlocked)
            return Forbid("User is blocked.");

        var valid = await _userManager.CheckPasswordAsync(user, password);
        if (!valid)
            return Unauthorized();

        var token = await GenerateJwtTokenAsync(user);
        return Ok(new { token });
    }

    [HttpGet("external/callback")]
    public async Task<IActionResult> ExternalCallback()
    {
        var info = await _signInManager.GetExternalLoginInfoAsync();

        if (info == null)
            return BadRequest("External login error");

        var signInResult = await _signInManager.ExternalLoginSignInAsync(
            info.LoginProvider,
            info.ProviderKey,
            false
        );

        ApplicationUser user;

        if (signInResult.Succeeded)
        {
            user = await _userManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey)
                ?? throw new InvalidOperationException("External login succeeded, but user was not found.");
        }
        else
        {
            var email = info.Principal.FindFirstValue(ClaimTypes.Email);
            if (email == null)
                return BadRequest("Email not received");

            var existingUser = await _userManager.FindByEmailAsync(email);

            if (existingUser == null)
            {
                user = new ApplicationUser
                {
                    UserName = email,
                    Email = email
                };

                var createResult = await _userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                    return BadRequest(createResult.Errors);

                await _userManager.AddToRoleAsync(user, "User");
            }
            else
            {
                user = existingUser;
            }

            var addLoginResult = await _userManager.AddLoginAsync(user, info);
            if (!addLoginResult.Succeeded)
                return BadRequest(addLoginResult.Errors);
        }

        if (user.IsBlocked)
            return Forbid("User is blocked.");

        var token = await GenerateJwtTokenAsync(user);

        return Ok(new { token });
    }

    [HttpGet("external/google")]
    public IActionResult GoogleLogin()
    {
        var redirectUrl = Url.Action(nameof(ExternalCallback));
        var properties = _signInManager.ConfigureExternalAuthenticationProperties("Google", redirectUrl!);
        return Challenge(properties, "Google");
    }

    [HttpGet("external/facebook")]
    public IActionResult FacebookLogin()
    {
        var redirectUrl = Url.Action(nameof(ExternalCallback));
        var properties = _signInManager.ConfigureExternalAuthenticationProperties("Facebook", redirectUrl!);
        return Challenge(properties, "Facebook");
    }

    private async Task<string> GenerateJwtTokenAsync(ApplicationUser user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var roles = await _userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email!),
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.UserName ?? user.Email ?? user.Id)
        };

        foreach (var role in roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(3),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
