namespace BlogApp.API.DTOs.Blog
{
    public class CreateBlogDto
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string? CoverImageUrl { get; set; }
        public string? Category { get; set; }
        public string? Tags { get; set; }
        public bool IsPublished { get; set; } = false;
    }

    public class UpdateBlogDto
    {
        public string? Title { get; set; }
        public string? Content { get; set; }
        public string? Summary { get; set; }
        public string? CoverImageUrl { get; set; }
        public string? Category { get; set; }
        public string? Tags { get; set; }
        public bool? IsPublished { get; set; }
    }

    public class BlogResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string? CoverImageUrl { get; set; }
        public string? Category { get; set; }
        public string? Tags { get; set; }
        public bool IsPublished { get; set; }
        public int ViewCount { get; set; }
        public int ReadTimeMinutes { get; set; }
        public int LikeCount { get; set; }
        public int CommentCount { get; set; }
        public bool IsLikedByCurrentUser { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? PublishedAt { get; set; }
        public AuthorDto Author { get; set; } = null!;
    }

    public class AuthorDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
    }

    public class BlogListResponseDto
    {
        public List<BlogResponseDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class CreateCommentDto
    {
        public string Content { get; set; } = string.Empty;
    }

    public class CommentResponseDto
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public AuthorDto Author { get; set; } = null!;
    }
}
