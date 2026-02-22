using System.ComponentModel.DataAnnotations;

namespace BlogApp.API.Models
{
    public class Blog
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(300)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Summary { get; set; }

        public string? CoverImageUrl { get; set; }

        [MaxLength(100)]
        public string? Category { get; set; }

        public string? Tags { get; set; } // comma-separated

        public bool IsPublished { get; set; } = false;

        public int ViewCount { get; set; } = 0;

        public int ReadTimeMinutes { get; set; } = 1;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? PublishedAt { get; set; }

        // Foreign key
        public int UserId { get; set; }
        public User Author { get; set; } = null!;

        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public ICollection<BlogLike> BlogLikes { get; set; } = new List<BlogLike>();
    }
}
