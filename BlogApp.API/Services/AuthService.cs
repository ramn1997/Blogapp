using BlogApp.API.Data;
using BlogApp.API.DTOs.Auth;
using BlogApp.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace BlogApp.API.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
        Task<AuthResponseDto> OAuthLoginAsync(OAuthLoginDto dto);
        Task<UserProfileDto> GetProfileAsync(int userId);
        Task<UserProfileDto> UpdateProfileAsync(int userId, UpdateProfileDto dto);
        Task<List<UserProfileDto>> GetAuthorsAsync(int count);
    }

    public class UpdateProfileDto
    {
        public string? FullName { get; set; }
        public string? Bio { get; set; }
        public string? PreferredEmail { get; set; }
        public string? AvatarUrl { get; set; }
    }

    public class AuthService : IAuthService
    {
        private readonly BlogDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(BlogDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                throw new InvalidOperationException("Email already registered.");

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email.ToLower(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Provider = "local",
                IsEmailVerified = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return GenerateAuthResponse(user);
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower() && u.Provider == "local");

            if (user == null || string.IsNullOrEmpty(user.PasswordHash))
                throw new UnauthorizedAccessException("Invalid email or password.");

            if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                throw new UnauthorizedAccessException("Invalid email or password.");

            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return GenerateAuthResponse(user);
        }

        public async Task<AuthResponseDto> OAuthLoginAsync(OAuthLoginDto dto)
        {
            dto = await ValidateOAuthLoginAsync(dto);

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Provider == dto.Provider && u.ProviderId == dto.ProviderId);

            if (user == null)
            {
                // Check if email exists with different provider
                var safeEmail = (dto.Email ?? "").ToLower();
                user = await _context.Users.FirstOrDefaultAsync(u => u.Email == safeEmail);
                if (user == null)
                {
                    // Create new user
                    user = new User
                    {
                        FullName = dto.FullName,
                        Email = (dto.Email ?? "").ToLower(),
                        Provider = dto.Provider.ToLower(),
                        ProviderId = dto.ProviderId,
                        AvatarUrl = dto.AvatarUrl,
                        IsEmailVerified = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.Users.Add(user);
                }
                else
                {
                    // Link provider to existing account
                    user.Provider = dto.Provider.ToLower();
                    user.ProviderId = dto.ProviderId;
                    user.AvatarUrl ??= dto.AvatarUrl;
                    user.UpdatedAt = DateTime.UtcNow;
                }
            }
            else
            {
                user.AvatarUrl = dto.AvatarUrl ?? user.AvatarUrl;
                user.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return GenerateAuthResponse(user);
        }

        private async Task<OAuthLoginDto> ValidateOAuthLoginAsync(OAuthLoginDto dto)
        {
            dto.Provider = dto.Provider.Trim().ToLowerInvariant();

            if (dto.Provider is "azure" or "microsoft")
            {
                return await ValidateMicrosoftLoginAsync(dto);
            }

            return dto;
        }

        private async Task<OAuthLoginDto> ValidateMicrosoftLoginAsync(OAuthLoginDto dto)
        {
            var clientId = _configuration["Authentication:Microsoft:ClientId"];
            var mobileClientId = _configuration["Authentication:Microsoft:MobileClientId"];
            var tenantId = _configuration["Authentication:Microsoft:TenantId"] ?? "common";

            if (string.IsNullOrWhiteSpace(clientId))
            {
                throw new InvalidOperationException("Microsoft authentication is not configured.");
            }

            var validAudiences = new List<string> { clientId };
            if (!string.IsNullOrWhiteSpace(mobileClientId))
            {
                validAudiences.Add(mobileClientId);
            }

            var authority = $"https://login.microsoftonline.com/{tenantId}/v2.0";
            var configurationManager = new ConfigurationManager<OpenIdConnectConfiguration>(
                $"{authority}/.well-known/openid-configuration",
                new OpenIdConnectConfigurationRetriever());

            var openIdConfig = await configurationManager.GetConfigurationAsync(CancellationToken.None);
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidAudiences = validAudiences,
                IssuerSigningKeys = openIdConfig.SigningKeys,
                IssuerValidator = (issuer, token, parameters) =>
                {
                    var tokenTenantId = GetJwtValue(token, "tid");
                    var expectedIssuer = $"https://login.microsoftonline.com/{tokenTenantId}/v2.0";

                    if (!string.IsNullOrWhiteSpace(tokenTenantId) &&
                        issuer.Equals(expectedIssuer, StringComparison.OrdinalIgnoreCase) &&
                        (tenantId.Equals("common", StringComparison.OrdinalIgnoreCase) ||
                         tenantId.Equals("organizations", StringComparison.OrdinalIgnoreCase) ||
                         tenantId.Equals("consumers", StringComparison.OrdinalIgnoreCase) ||
                         tenantId.Equals(tokenTenantId, StringComparison.OrdinalIgnoreCase)))
                    {
                        return issuer;
                    }

                    throw new SecurityTokenInvalidIssuerException("Invalid Microsoft token issuer.");
                }
            };

            var principal = new JwtSecurityTokenHandler()
                .ValidateToken(dto.IdToken, validationParameters, out _);

            var providerId = principal.FindFirstValue("oid")
                ?? principal.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? principal.FindFirstValue("sub")
                ?? throw new SecurityTokenValidationException("Microsoft token does not include a user id.");

            var email = principal.FindFirstValue("preferred_username")
                ?? principal.FindFirstValue(ClaimTypes.Email)
                ?? principal.FindFirstValue("email")
                ?? throw new SecurityTokenValidationException("Microsoft token does not include an email address.");

            return new OAuthLoginDto
            {
                Provider = "microsoft",
                IdToken = dto.IdToken,
                Email = email,
                FullName = principal.FindFirstValue("name") ?? dto.FullName ?? email,
                AvatarUrl = dto.AvatarUrl,
                ProviderId = providerId
            };
        }

        private static string? GetJwtValue(SecurityToken token, string claimType)
        {
            if (token is JwtSecurityToken jwt)
            {
                return jwt.Claims.FirstOrDefault(c => c.Type == claimType)?.Value;
            }

            return null;
        }

        public async Task<UserProfileDto> GetProfileAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("User not found.");

            return MapToProfile(user);
        }

        public async Task<UserProfileDto> UpdateProfileAsync(int userId, UpdateProfileDto dto)
        {
            var user = await _context.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("User not found.");

            if (dto.FullName != null) user.FullName = dto.FullName;
            if (dto.Bio != null) user.Bio = dto.Bio;
            if (dto.PreferredEmail != null) user.PreferredEmail = dto.PreferredEmail;
            if (dto.AvatarUrl != null) user.AvatarUrl = dto.AvatarUrl;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToProfile(user);
        }

        public async Task<List<UserProfileDto>> GetAuthorsAsync(int count)
        {
            var authors = await _context.Users
                .OrderByDescending(u => u.Blogs.Count)
                .Take(count)
                .ToListAsync();

            return authors.Select(MapToProfile).ToList();
        }

        private AuthResponseDto GenerateAuthResponse(User user)
        {
            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            return new AuthResponseDto
            {
                Token = token,
                RefreshToken = refreshToken,
                User = MapToProfile(user)
            };
        }

        private string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured")));

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim("provider", user.Provider ?? "local")
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        private static UserProfileDto MapToProfile(User user) => new()
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            AvatarUrl = user.AvatarUrl,
            Bio = user.Bio,
            PreferredEmail = user.PreferredEmail,
            Provider = user.Provider,
            CreatedAt = user.CreatedAt
        };
    }
}
