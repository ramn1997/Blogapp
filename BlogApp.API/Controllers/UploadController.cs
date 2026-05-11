using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlogApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<UploadController> _logger;

        public UploadController(IWebHostEnvironment environment, ILogger<UploadController> logger)
        {
            _environment = environment;
            _logger = logger;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
        {
            _logger.LogInformation("UploadImage endpoint hit. File name: {FileName}", file?.FileName);

            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded or file is empty.");

            var extension = Path.GetExtension(file.FileName)?.ToLowerInvariant();
            
            // Allow png by default if it's a blob/clipboard paste without an extension
            if (string.IsNullOrEmpty(extension) && file.ContentType.Contains("image/"))
            {
                extension = "." + file.ContentType.Split('/')[1];
                if (extension == ".jpeg") extension = ".jpg";
            }

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            if (string.IsNullOrEmpty(extension) || !allowedExtensions.Contains(extension))
            {
                return BadRequest($"Unsupported file type: {extension ?? "unknown"}");
            }

            // Sync with Program.cs path logic
            var isAzure = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("WEBSITE_SITE_NAME"));
            var uploadBaseUrl = isAzure ? "/home/site/wwwroot" : (_environment.WebRootPath ?? "wwwroot");
            var uploadsFolder = Path.GetFullPath(Path.Combine(uploadBaseUrl, "uploads"));
            
            try
            {
                if (!Directory.Exists(uploadsFolder))
                {
                    _logger.LogInformation("Creating uploads directory: {Path}", uploadsFolder);
                    Directory.CreateDirectory(uploadsFolder);
                }

                var fileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadsFolder, fileName);

                _logger.LogInformation("Saving file to: {Path}", filePath);
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Return relative URL that works with app.UseStaticFiles mapping
                return Ok(new { url = $"/uploads/{fileName}" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save upload to {Path}", uploadsFolder);
                return StatusCode(500, new { message = "Failed to save image on server.", details = ex.Message });
            }
        }
    }
}
