using System.ComponentModel.DataAnnotations;

namespace BlogApp.API.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        public string? PasswordHash { get; set; }

        [MaxLength(50)]
        public string? Provider { get; set; } // "local", "google", "microsoft"

        public string? ProviderId { get; set; }

        public string? AvatarUrl { get; set; }

        public string? Bio { get; set; }

        public bool IsEmailVerified { get; set; } = false;

        public string? PreferredEmail { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Blog> Blogs { get; set; } = new List<Blog>();
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public ICollection<BlogLike> BlogLikes { get; set; } = new List<BlogLike>();
    }
}
