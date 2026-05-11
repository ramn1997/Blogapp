using BlogApp.API.Data;
using BlogApp.API.DTOs.Blog;
using BlogApp.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace BlogApp.API.Services
{
    public interface IBlogService
    {
        Task<BlogListResponseDto> GetBlogsAsync(int page, int pageSize, string? category, string? search, int? currentUserId, int? authorId = null, string? sortBy = null);
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
    }

    public class BlogService : IBlogService
    {
        private readonly BlogDbContext _context;
        private readonly IMemoryCache _cache;
        private const string CategoriesCacheKey = "blog_categories";
        private const string BlogsCacheKeyPrefix = "blogs_list_";

        public BlogService(BlogDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
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

        public async Task<BlogListResponseDto> GetBlogsAsync(int page, int pageSize, string? category, string? search, int? currentUserId, int? authorId = null, string? sortBy = null)
        {
            // Try to get from cache if no search/userId involved
            string cacheKey = $"{BlogsCacheKeyPrefix}{page}_{pageSize}_{category}_{authorId}_{sortBy}";
            bool useCache = string.IsNullOrWhiteSpace(search) && !currentUserId.HasValue;

            if (useCache && _cache.TryGetValue(cacheKey, out BlogListResponseDto? cachedResponse) && cachedResponse != null)
            {
                return cachedResponse;
            }

            var query = _context.Blogs
                .AsNoTracking()
                .Where(b => b.IsPublished)
                .AsQueryable();

            if (authorId.HasValue)
                query = query.Where(b => b.UserId == authorId.Value);

            if (!string.IsNullOrWhiteSpace(category))
                query = query.Where(b => b.Category == category);

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(b => b.Title.Contains(search) || b.Content.Contains(search) || (b.Tags != null && b.Tags.Contains(search)));

            var total = await query.CountAsync();
            
            if (sortBy == "trending")
            {
                query = query.OrderByDescending(b => b.BlogLikes.Count)
                             .ThenByDescending(b => b.ViewCount)
                             .ThenByDescending(b => b.PublishedAt);
            }
            else if (sortBy == "latest")
            {
                query = query.OrderByDescending(b => b.PublishedAt);
            }
            else
            {
                query = query.OrderByDescending(b => b.PublishedAt);
            }

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new BlogListItemDto
                {
                    Id = b.Id,
                    Title = b.Title,
                    Summary = b.Summary,
                    CoverImageUrl = b.CoverImageUrl,
                    Category = b.Category,
                    Tags = b.Tags,
                    IsPublished = b.IsPublished,
                    ViewCount = b.ViewCount,
                    ReadTimeMinutes = b.ReadTimeMinutes,
                    LikeCount = b.BlogLikes.Count,
                    CommentCount = b.Comments.Count,
                    IsLikedByCurrentUser = currentUserId.HasValue && b.BlogLikes.Any(l => l.UserId == currentUserId.Value),
                    IsSavedByCurrentUser = currentUserId.HasValue && b.SavedBlogs.Any(s => s.UserId == currentUserId.Value),
                    CreatedAt = b.CreatedAt,
                    PublishedAt = b.PublishedAt,
                    Author = new AuthorDto
                    {
                        Id = b.Author.Id,
                        FullName = b.Author.FullName,
                        AvatarUrl = b.Author.AvatarUrl
                    }
                })
                .ToListAsync();

            var response = new BlogListResponseDto
            {
                Items = items,
                TotalCount = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)total / pageSize)
            };

            if (useCache)
            {
                _cache.Set(cacheKey, response, TimeSpan.FromMinutes(10));
            }

            return response;
        }

        public async Task<BlogResponseDto> GetBlogByIdAsync(int id, int? currentUserId)
        {
            var blog = await _context.Blogs
                .Include(b => b.Author)
                .Include(b => b.BlogLikes)
                .Include(b => b.SavedBlogs)
                .Include(b => b.Comments)
                .AsNoTracking()
                .AsSplitQuery()
                .FirstOrDefaultAsync(b => b.Id == id)
                ?? throw new KeyNotFoundException("Blog not found.");

            // Increment view count safely
            _context.Blogs.Where(b => b.Id == id).ExecuteUpdate(s => s.SetProperty(b => b.ViewCount, b => b.ViewCount + 1));

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

            InvalidateCache();
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
            InvalidateCache();
            return MapToBlogResponse(blog, userId);
        }

        public async Task DeleteBlogAsync(int blogId, int userId)
        {
            var blog = await _context.Blogs
                .FirstOrDefaultAsync(b => b.Id == blogId && b.UserId == userId)
                ?? throw new UnauthorizedAccessException("Blog not found or not authorized.");

            _context.Blogs.Remove(blog);
            await _context.SaveChangesAsync();
            InvalidateCache();
        }

        public async Task<BlogListResponseDto> GetUserBlogsAsync(int userId, int page, int pageSize, bool? publishedOnly = null)
        {
            var query = _context.Blogs
                .AsNoTracking()
                .Where(b => b.UserId == userId);

            if (publishedOnly.HasValue)
                query = query.Where(b => b.IsPublished == publishedOnly.Value);

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(b => b.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new BlogListItemDto
                {
                    Id = b.Id,
                    Title = b.Title,
                    Summary = b.Summary,
                    CoverImageUrl = b.CoverImageUrl,
                    Category = b.Category,
                    Tags = b.Tags,
                    IsPublished = b.IsPublished,
                    ViewCount = b.ViewCount,
                    ReadTimeMinutes = b.ReadTimeMinutes,
                    LikeCount = b.BlogLikes.Count,
                    CommentCount = b.Comments.Count,
                    IsLikedByCurrentUser = b.BlogLikes.Any(l => l.UserId == userId),
                    IsSavedByCurrentUser = b.SavedBlogs.Any(s => s.UserId == userId),
                    CreatedAt = b.CreatedAt,
                    PublishedAt = b.PublishedAt,
                    Author = new AuthorDto
                    {
                        Id = b.Author.Id,
                        FullName = b.Author.FullName,
                        AvatarUrl = b.Author.AvatarUrl
                    }
                })
                .ToListAsync();

            return new BlogListResponseDto
            {
                Items = items,
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
                .AsNoTracking()
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
            if (_cache.TryGetValue(CategoriesCacheKey, out List<string>? categories) && categories != null)
                return categories;

            categories = await _context.Blogs
                .Where(b => b.IsPublished && b.Category != null)
                .Select(b => b.Category!)
                .Distinct()
                .ToListAsync();

            _cache.Set(CategoriesCacheKey, categories, TimeSpan.FromMinutes(30));
            return categories;
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
                .AsNoTracking()
                .Where(sb => sb.UserId == userId);

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(sb => sb.SavedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(sb => new BlogListItemDto
                {
                    Id = sb.Blog.Id,
                    Title = sb.Blog.Title,
                    Summary = sb.Blog.Summary,
                    CoverImageUrl = sb.Blog.CoverImageUrl,
                    Category = sb.Blog.Category,
                    Tags = sb.Blog.Tags,
                    IsPublished = sb.Blog.IsPublished,
                    ViewCount = sb.Blog.ViewCount,
                    ReadTimeMinutes = sb.Blog.ReadTimeMinutes,
                    LikeCount = sb.Blog.BlogLikes.Count,
                    CommentCount = sb.Blog.Comments.Count,
                    IsLikedByCurrentUser = sb.Blog.BlogLikes.Any(l => l.UserId == userId),
                    IsSavedByCurrentUser = true, // It's in the saved blogs table, so yes.
                    CreatedAt = sb.Blog.CreatedAt,
                    PublishedAt = sb.Blog.PublishedAt,
                    Author = new AuthorDto
                    {
                        Id = sb.Blog.Author.Id,
                        FullName = sb.Blog.Author.FullName,
                        AvatarUrl = sb.Blog.Author.AvatarUrl
                    }
                })
                .ToListAsync();

            return new BlogListResponseDto
            {
                Items = items,
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

        private void InvalidateCache()
        {
            // Simplistic cache invalidation for the sake of demo, 
            // in a real app you might want more granular control or use a distributed cache.
            // Note: IMemoryCache doesn't support clearing by prefix easily, 
            // so we'll just let them expire or use a manual list if needed.
            // For now, let's at least clear the categories.
            _cache.Remove(CategoriesCacheKey);
        }
    }
}
