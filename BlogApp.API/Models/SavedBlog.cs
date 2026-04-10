using System.ComponentModel.DataAnnotations;

namespace BlogApp.API.Models
{
    public class SavedBlog
    {
        public int Id { get; set; }

        public int BlogId { get; set; }
        public Blog Blog { get; set; } = null!;

        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public DateTime SavedAt { get; set; } = DateTime.UtcNow;
    }
}
