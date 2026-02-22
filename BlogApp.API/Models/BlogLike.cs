namespace BlogApp.API.Models
{
    public class BlogLike
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public int BlogId { get; set; }
        public Blog Blog { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
