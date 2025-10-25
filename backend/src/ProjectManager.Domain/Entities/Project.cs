// src/ProjectManager.Domain/Entities/Project.cs
using ProjectManager.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace ProjectManager.Domain.Entities
{
    public class Project : BaseEntity
    {
        [Required]
        [StringLength(100, MinimumLength = 3)]
        public string Title { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        public int UserId { get; set; }

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual ICollection<ProjectTask> Tasks { get; set; } = new List<ProjectTask>();
    }
}
