using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BlogApp.API.Models
{
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; } // The target user receiving the notification
        
        [ForeignKey("UserId")]
        public User User { get; set; }

        public string Type { get; set; } // "Like", "Comment", "View", "Save"
        public string Message { get; set; }
        public int? RelatedBlogId { get; set; }
        public int? ActorId { get; set; } // The user who performed the action
        
        [ForeignKey("ActorId")]
        public User Actor { get; set; }

        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
