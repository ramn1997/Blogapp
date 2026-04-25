using BlogApp.API.Data;
using BlogApp.API.DTOs.Blog;
using BlogApp.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BlogApp.API.Services
{
    public interface IBlogService
    {
        Task<BlogListResponseDto> GetBlogsAsync(int page, int pageSize, string? category, string? search, int? currentUserId, int? authorId = null);
        Task<BlogResponseDto> GetBlogByIdAsync(int id, int? currentUserId);
        Task<BlogResponseDto> CreateBlogAsync(int userId, CreateBlogDto dto);
        Task<BlogResponseDto> UpdateBlogAsync(int blogId, int userId, UpdateBlogDto dto);
        Task DeleteBlogAsync(int blogId, int userId);
        Task<BlogListResponseDto> GetUserBlogsAsync(int userId, int page, int pageSize, bool? publishedOnly = null);
        Task<bool> ToggleLikeAsync(int blogId, int userId);
        Task<CommentResponseDto> AddCommentAsync(int blogId, int userId, CreateCommentDto dto);
        Task<List<CommentResponseDto>> GetCommentsAsync(int blogId);
        Task DeleteCommentAsync(int commentId, int userId);
        Task<List<string>> GetCategoriesAsync();
        Task<bool> ToggleSaveAsync(int blogId, int userId);
        Task<BlogListResponseDto> GetSavedBlogsAsync(int userId, int page, int pageSize);
        Task<BlogListResponseDto> GetInteractedBlogsAsync(int userId, int page, int pageSize);
    }

    public class BlogService : IBlogService
    {
        private readonly BlogDbContext _context;

        public BlogService(BlogDbContext context)
        {
            _context = context;
        }

        private async Task AddNotification(int targetUserId, int actorId, int blogId, string type, string message)
        {
            if (targetUserId == actorId) return;

            var notification = new Notification
            {
                UserId = targetUserId,
                ActorId = actorId,
                RelatedBlogId = blogId,
                Type = type,
                Message = message,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }

        public async Task<BlogListResponseDto> GetBlogsAsync(int page, int pageSize, string? category, string? search, int? currentUserId, int? authorId = null)
        {
            var query = _context.Blogs
                .Include(b => b.Author)
                .Include(b => b.BlogLikes)
                .Include(b => b.SavedBlogs)
                .Include(b => b.Comments)
                .Where(b => b.IsPublished)
                .AsQueryable();

            if (authorId.HasValue)
                query = query.Where(b => b.UserId == authorId.Value);

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
                .Include(b => b.SavedBlogs)
                .Include(b => b.Comments)
                .FirstOrDefaultAsync(b => b.Id == id)
                ?? throw new KeyNotFoundException("Blog not found.");

            // Increment view count
            blog.ViewCount++;
            await _context.SaveChangesAsync();

            // Notification for View
            if (currentUserId.HasValue && currentUserId.Value != blog.UserId)
            {
                var actor = await _context.Users.FindAsync(currentUserId.Value);
                await AddNotification(blog.UserId, currentUserId.Value, blog.Id, "View", $"{actor?.FullName} viewed your story: {blog.Title}");
            }

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
                .Include(b => b.SavedBlogs)
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

        public async Task<BlogListResponseDto> GetUserBlogsAsync(int userId, int page, int pageSize, bool? publishedOnly = null)
        {
            var query = _context.Blogs
                .Include(b => b.Author)
                .Include(b => b.BlogLikes)
                .Include(b => b.SavedBlogs)
                .Include(b => b.Comments)
                .Where(b => b.UserId == userId);

            if (publishedOnly.HasValue)
                query = query.Where(b => b.IsPublished == publishedOnly.Value);

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
            var blog = await _context.Blogs.FindAsync(blogId);
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

            if (blog != null)
            {
                var actor = await _context.Users.FindAsync(userId);
                await AddNotification(blog.UserId, userId, blogId, "Like", $"{actor?.FullName} liked your story: {blog.Title}");
            }

            return true;
        }

        public async Task<CommentResponseDto> AddCommentAsync(int blogId, int userId, CreateCommentDto dto)
        {
            var blog = await _context.Blogs.FindAsync(blogId);
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

            if (blog != null)
            {
                var actor = await _context.Users.FindAsync(userId);
                await AddNotification(blog.UserId, userId, blogId, "Comment", $"{actor?.FullName} commented on your story: {blog.Title}");
            }

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

        public async Task<bool> ToggleSaveAsync(int blogId, int userId)
        {
            var blog = await _context.Blogs.FindAsync(blogId);
            var existing = await _context.SavedBlogs
                .FirstOrDefaultAsync(sb => sb.BlogId == blogId && sb.UserId == userId);

            if (existing != null)
            {
                _context.SavedBlogs.Remove(existing);
                await _context.SaveChangesAsync();
                return false;
            }

            _context.SavedBlogs.Add(new SavedBlog { BlogId = blogId, UserId = userId });
            await _context.SaveChangesAsync();

            if (blog != null)
            {
                var actor = await _context.Users.FindAsync(userId);
                await AddNotification(blog.UserId, userId, blogId, "Save", $"{actor?.FullName} saved your story to their library: {blog.Title}");
            }

            return true;
        }

        public async Task<BlogListResponseDto> GetSavedBlogsAsync(int userId, int page, int pageSize)
        {
            var query = _context.SavedBlogs
                .Include(sb => sb.Blog)
                .ThenInclude(b => b.Author)
                .Include(sb => sb.Blog)
                .ThenInclude(b => b.BlogLikes)
                .Include(sb => sb.Blog)
                .ThenInclude(b => b.SavedBlogs)
                .Where(sb => sb.UserId == userId);

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(sb => sb.SavedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new BlogListResponseDto
            {
                Items = items.Select(sb => MapToBlogResponse(sb.Blog, userId)).ToList(),
                TotalCount = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)total / pageSize)
            };
        }

        public async Task<BlogListResponseDto> GetInteractedBlogsAsync(int userId, int page, int pageSize)
        {
            // Blogs that the user liked
            var likedIds = await _context.BlogLikes
                .Where(bl => bl.UserId == userId)
                .Select(bl => bl.BlogId)
                .ToListAsync();

            // Blogs that the user saved
            var savedIds = await _context.SavedBlogs
                .Where(sb => sb.UserId == userId)
                .Select(sb => sb.BlogId)
                .ToListAsync();

            // Blogs that the user commented on
            var commentedIds = await _context.Comments
                .Where(c => c.UserId == userId)
                .Select(c => c.BlogId)
                .ToListAsync();

            // Combine all IDs and remove duplicates
            var interactedBlogIds = likedIds
                .Concat(savedIds)
                .Concat(commentedIds)
                .Distinct()
                .ToList();

            var query = _context.Blogs
                .Include(b => b.Author)
                .Include(b => b.BlogLikes)
                .Include(b => b.SavedBlogs)
                .Include(b => b.Comments)
                .Where(b => interactedBlogIds.Contains(b.Id) && b.IsPublished);

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(b => b.PublishedAt)
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
            LikeCount = blog.BlogLikes?.Count ?? 0,
            CommentCount = blog.Comments?.Count ?? 0,
            IsLikedByCurrentUser = currentUserId.HasValue && blog.BlogLikes != null && blog.BlogLikes.Any(l => l.UserId == currentUserId.Value),
            IsSavedByCurrentUser = currentUserId.HasValue && blog.SavedBlogs != null && blog.SavedBlogs.Any(s => s.UserId == currentUserId.Value),
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
