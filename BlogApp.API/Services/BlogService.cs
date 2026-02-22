using BlogApp.API.Data;
using BlogApp.API.DTOs.Blog;
using BlogApp.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BlogApp.API.Services
{
    public interface IBlogService
    {
        Task<BlogListResponseDto> GetBlogsAsync(int page, int pageSize, string? category, string? search, int? currentUserId);
        Task<BlogResponseDto> GetBlogByIdAsync(int id, int? currentUserId);
        Task<BlogResponseDto> CreateBlogAsync(int userId, CreateBlogDto dto);
        Task<BlogResponseDto> UpdateBlogAsync(int blogId, int userId, UpdateBlogDto dto);
        Task DeleteBlogAsync(int blogId, int userId);
        Task<BlogListResponseDto> GetUserBlogsAsync(int userId, int page, int pageSize);
        Task<bool> ToggleLikeAsync(int blogId, int userId);
        Task<CommentResponseDto> AddCommentAsync(int blogId, int userId, CreateCommentDto dto);
        Task<List<CommentResponseDto>> GetCommentsAsync(int blogId);
        Task DeleteCommentAsync(int commentId, int userId);
        Task<List<string>> GetCategoriesAsync();
    }

    public class BlogService : IBlogService
    {
        private readonly BlogDbContext _context;

        public BlogService(BlogDbContext context)
        {
            _context = context;
        }

        public async Task<BlogListResponseDto> GetBlogsAsync(int page, int pageSize, string? category, string? search, int? currentUserId)
        {
            var query = _context.Blogs
                .Include(b => b.Author)
                .Include(b => b.BlogLikes)
                .Include(b => b.Comments)
                .Where(b => b.IsPublished)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(category))
                query = query.Where(b => b.Category == category);

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(b => b.Title.Contains(search) || b.Content.Contains(search) || (b.Tags != null && b.Tags.Contains(search)));

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(b => b.PublishedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new BlogListResponseDto
            {
                Items = items.Select(b => MapToBlogResponse(b, currentUserId)).ToList(),
                TotalCount = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)total / pageSize)
            };
        }

        public async Task<BlogResponseDto> GetBlogByIdAsync(int id, int? currentUserId)
        {
            var blog = await _context.Blogs
                .Include(b => b.Author)
                .Include(b => b.BlogLikes)
                .Include(b => b.Comments)
                .FirstOrDefaultAsync(b => b.Id == id)
                ?? throw new KeyNotFoundException("Blog not found.");

            // Increment view count
            blog.ViewCount++;
            await _context.SaveChangesAsync();

            return MapToBlogResponse(blog, currentUserId);
        }

        public async Task<BlogResponseDto> CreateBlogAsync(int userId, CreateBlogDto dto)
        {
            var wordCount = dto.Content.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
            var readTime = Math.Max(1, (int)Math.Ceiling(wordCount / 200.0));

            var blog = new Blog
            {
                Title = dto.Title,
                Content = dto.Content,
                Summary = dto.Summary ?? GenerateSummary(dto.Content),
                CoverImageUrl = dto.CoverImageUrl,
                Category = dto.Category,
                Tags = dto.Tags,
                IsPublished = dto.IsPublished,
                ReadTimeMinutes = readTime,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                PublishedAt = dto.IsPublished ? DateTime.UtcNow : null
            };

            _context.Blogs.Add(blog);
            await _context.SaveChangesAsync();

            await _context.Entry(blog).Reference(b => b.Author).LoadAsync();
            return MapToBlogResponse(blog, userId);
        }

        public async Task<BlogResponseDto> UpdateBlogAsync(int blogId, int userId, UpdateBlogDto dto)
        {
            var blog = await _context.Blogs
                .Include(b => b.Author)
                .Include(b => b.BlogLikes)
                .Include(b => b.Comments)
                .FirstOrDefaultAsync(b => b.Id == blogId && b.UserId == userId)
                ?? throw new UnauthorizedAccessException("Blog not found or not authorized.");

            if (dto.Title != null) blog.Title = dto.Title;
            if (dto.Content != null)
            {
                blog.Content = dto.Content;
                var wordCount = dto.Content.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
                blog.ReadTimeMinutes = Math.Max(1, (int)Math.Ceiling(wordCount / 200.0));
            }
            if (dto.Summary != null) blog.Summary = dto.Summary;
            if (dto.CoverImageUrl != null) blog.CoverImageUrl = dto.CoverImageUrl;
            if (dto.Category != null) blog.Category = dto.Category;
            if (dto.Tags != null) blog.Tags = dto.Tags;
            if (dto.IsPublished.HasValue)
            {
                if (dto.IsPublished.Value && !blog.IsPublished)
                    blog.PublishedAt = DateTime.UtcNow;
                blog.IsPublished = dto.IsPublished.Value;
            }
            blog.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToBlogResponse(blog, userId);
        }

        public async Task DeleteBlogAsync(int blogId, int userId)
        {
            var blog = await _context.Blogs
                .FirstOrDefaultAsync(b => b.Id == blogId && b.UserId == userId)
                ?? throw new UnauthorizedAccessException("Blog not found or not authorized.");

            _context.Blogs.Remove(blog);
            await _context.SaveChangesAsync();
        }

        public async Task<BlogListResponseDto> GetUserBlogsAsync(int userId, int page, int pageSize)
        {
            var query = _context.Blogs
                .Include(b => b.Author)
                .Include(b => b.BlogLikes)
                .Include(b => b.Comments)
                .Where(b => b.UserId == userId);

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(b => b.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new BlogListResponseDto
            {
                Items = items.Select(b => MapToBlogResponse(b, userId)).ToList(),
                TotalCount = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)total / pageSize)
            };
        }

        public async Task<bool> ToggleLikeAsync(int blogId, int userId)
        {
            var existing = await _context.BlogLikes
                .FirstOrDefaultAsync(bl => bl.BlogId == blogId && bl.UserId == userId);

            if (existing != null)
            {
                _context.BlogLikes.Remove(existing);
                await _context.SaveChangesAsync();
                return false;
            }

            _context.BlogLikes.Add(new BlogLike { BlogId = blogId, UserId = userId });
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<CommentResponseDto> AddCommentAsync(int blogId, int userId, CreateCommentDto dto)
        {
            var comment = new Comment
            {
                Content = dto.Content,
                BlogId = blogId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();
            await _context.Entry(comment).Reference(c => c.Author).LoadAsync();

            return MapToComment(comment);
        }

        public async Task<List<CommentResponseDto>> GetCommentsAsync(int blogId)
        {
            var comments = await _context.Comments
                .Include(c => c.Author)
                .Where(c => c.BlogId == blogId)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();

            return comments.Select(MapToComment).ToList();
        }

        public async Task DeleteCommentAsync(int commentId, int userId)
        {
            var comment = await _context.Comments
                .FirstOrDefaultAsync(c => c.Id == commentId && c.UserId == userId)
                ?? throw new UnauthorizedAccessException("Comment not found or not authorized.");

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();
        }

        public async Task<List<string>> GetCategoriesAsync()
        {
            return await _context.Blogs
                .Where(b => b.IsPublished && b.Category != null)
                .Select(b => b.Category!)
                .Distinct()
                .ToListAsync();
        }

        private static BlogResponseDto MapToBlogResponse(Blog blog, int? currentUserId) => new()
        {
            Id = blog.Id,
            Title = blog.Title,
            Content = blog.Content,
            Summary = blog.Summary,
            CoverImageUrl = blog.CoverImageUrl,
            Category = blog.Category,
            Tags = blog.Tags,
            IsPublished = blog.IsPublished,
            ViewCount = blog.ViewCount,
            ReadTimeMinutes = blog.ReadTimeMinutes,
            LikeCount = blog.BlogLikes.Count,
            CommentCount = blog.Comments.Count,
            IsLikedByCurrentUser = currentUserId.HasValue && blog.BlogLikes.Any(l => l.UserId == currentUserId.Value),
            CreatedAt = blog.CreatedAt,
            PublishedAt = blog.PublishedAt,
            Author = new AuthorDto
            {
                Id = blog.Author.Id,
                FullName = blog.Author.FullName,
                AvatarUrl = blog.Author.AvatarUrl
            }
        };

        private static CommentResponseDto MapToComment(Comment comment) => new()
        {
            Id = comment.Id,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            Author = new AuthorDto
            {
                Id = comment.Author.Id,
                FullName = comment.Author.FullName,
                AvatarUrl = comment.Author.AvatarUrl
            }
        };

        private static string GenerateSummary(string content)
        {
            var plain = System.Text.RegularExpressions.Regex.Replace(content, "<.*?>", string.Empty);
            return plain.Length > 200 ? plain[..200] + "..." : plain;
        }
    }
}
