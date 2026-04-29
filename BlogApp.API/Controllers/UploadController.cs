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
            _logger.LogInformation("UploadImage endpoint hit. File is null? {IsNull}", file == null);

            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            _logger.LogInformation("File name: {FileName}, ContentType: {ContentType}, Length: {Length}", file.FileName, file.ContentType, file.Length);

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
                _logger.LogWarning("Invalid or missing extension rejected: {Extension}", extension);
                return BadRequest($"Invalid file type: {extension ?? "unknown"}");
            }

            var isAzure = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("WEBSITE_SITE_NAME"));
            var webRoot = isAzure ? "/home/site/wwwroot" : (_environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"));
            var uploadsFolder = Path.Combine(webRoot, "uploads");
            
            _logger.LogInformation("Saving to folder: {Folder}", uploadsFolder);
            
            try
            {
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var fileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var relativeUrl = $"/uploads/{fileName}";
                
                _logger.LogInformation("Upload successful. Relative URL: {Url}", relativeUrl);

                return Ok(new { url = relativeUrl });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while saving the uploaded file");
                return StatusCode(500, "Internal server error during upload");
            }
        }
    }
}
