// src/ProjectManager.Domain/Entities/ProjectTask.cs
using ProjectManager.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace ProjectManager.Domain.Entities
{
    public class ProjectTask : BaseEntity
    {
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        public DateTime? DueDate { get; set; }

        public bool IsCompleted { get; set; } = false;

        public DateTime? CompletedDate { get; set; }

        [Required]
        public int ProjectId { get; set; }

        // Navigation properties
        public virtual Project Project { get; set; } = null!;
    }
}
