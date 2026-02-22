using System.ComponentModel.DataAnnotations;

namespace BlogApp.API.Models
{
    public class Comment
    {
        public int Id { get; set; }

        [Required]
        public string Content { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int UserId { get; set; }
        public User Author { get; set; } = null!;

        public int BlogId { get; set; }
        public Blog Blog { get; set; } = null!;
    }
}
