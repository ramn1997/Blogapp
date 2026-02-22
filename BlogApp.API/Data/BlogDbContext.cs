using Microsoft.EntityFrameworkCore;
using BlogApp.API.Models;

namespace BlogApp.API.Data
{
    public class BlogDbContext : DbContext
    {
        public BlogDbContext(DbContextOptions<BlogDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Blog> Blogs { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<BlogLike> BlogLikes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Blog → Author (many-to-one)
            modelBuilder.Entity<Blog>()
                .HasOne(b => b.Author)
                .WithMany(u => u.Blogs)
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Comment → Author (many-to-one)
            modelBuilder.Entity<Comment>()
                .HasOne(c => c.Author)
                .WithMany(u => u.Comments)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // Comment → Blog (many-to-one)
            modelBuilder.Entity<Comment>()
                .HasOne(c => c.Blog)
                .WithMany(b => b.Comments)
                .HasForeignKey(c => c.BlogId)
                .OnDelete(DeleteBehavior.Cascade);

            // BlogLike
            modelBuilder.Entity<BlogLike>()
                .HasOne(bl => bl.User)
                .WithMany(u => u.BlogLikes)
                .HasForeignKey(bl => bl.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<BlogLike>()
                .HasOne(bl => bl.Blog)
                .WithMany(b => b.BlogLikes)
                .HasForeignKey(bl => bl.BlogId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<BlogLike>()
                .HasIndex(bl => new { bl.UserId, bl.BlogId })
                .IsUnique();
        }
    }
}
