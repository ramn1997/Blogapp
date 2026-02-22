using BlogApp.API.DTOs.Blog;
using BlogApp.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BlogApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BlogsController : ControllerBase
    {
        private readonly IBlogService _blogService;

        public BlogsController(IBlogService blogService)
        {
            _blogService = blogService;
        }

        /// <summary>Get all published blogs with optional filters</summary>
        [HttpGet]
        public async Task<IActionResult> GetBlogs(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? category = null,
            [FromQuery] string? search = null)
        {
            var userId = TryGetCurrentUserId();
            var result = await _blogService.GetBlogsAsync(page, pageSize, category, search, userId);
            return Ok(result);
        }

        /// <summary>Get blog categories</summary>
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var result = await _blogService.GetCategoriesAsync();
            return Ok(result);
        }

        /// <summary>Get a single blog by ID</summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetBlog(int id)
        {
            try
            {
                var userId = TryGetCurrentUserId();
                var result = await _blogService.GetBlogByIdAsync(id, userId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        /// <summary>Create a new blog post</summary>
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateBlog([FromBody] CreateBlogDto dto)
        {
            var userId = GetCurrentUserId();
            var result = await _blogService.CreateBlogAsync(userId, dto);
            return CreatedAtAction(nameof(GetBlog), new { id = result.Id }, result);
        }

        /// <summary>Update a blog post</summary>
        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBlog(int id, [FromBody] UpdateBlogDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _blogService.UpdateBlogAsync(id, userId, dto);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        /// <summary>Delete a blog post</summary>
        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBlog(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _blogService.DeleteBlogAsync(id, userId);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        /// <summary>Get blogs by current user</summary>
        [Authorize]
        [HttpGet("my")]
        public async Task<IActionResult> GetMyBlogs([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var userId = GetCurrentUserId();
            var result = await _blogService.GetUserBlogsAsync(userId, page, pageSize);
            return Ok(result);
        }

        /// <summary>Toggle like on a blog post</summary>
        [Authorize]
        [HttpPost("{id}/like")]
        public async Task<IActionResult> ToggleLike(int id)
        {
            var userId = GetCurrentUserId();
            var liked = await _blogService.ToggleLikeAsync(id, userId);
            return Ok(new { liked });
        }

        /// <summary>Get comments for a blog post</summary>
        [HttpGet("{id}/comments")]
        public async Task<IActionResult> GetComments(int id)
        {
            var result = await _blogService.GetCommentsAsync(id);
            return Ok(result);
        }

        /// <summary>Add a comment to a blog post</summary>
        [Authorize]
        [HttpPost("{id}/comments")]
        public async Task<IActionResult> AddComment(int id, [FromBody] CreateCommentDto dto)
        {
            var userId = GetCurrentUserId();
            var result = await _blogService.AddCommentAsync(id, userId, dto);
            return Ok(result);
        }

        /// <summary>Delete a comment</summary>
        [Authorize]
        [HttpDelete("{blogId}/comments/{commentId}")]
        public async Task<IActionResult> DeleteComment(int blogId, int commentId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _blogService.DeleteCommentAsync(commentId, userId);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(claim ?? throw new UnauthorizedAccessException());
        }

        private int? TryGetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return claim != null ? int.Parse(claim) : null;
        }
    }
}
