// src/ProjectManager.Application/DTOs/Projects/CreateProjectDto.cs
using System.ComponentModel.DataAnnotations;

namespace ProjectManager.Application.DTOs.Projects
{
    public class CreateProjectDto
    {
        [Required]
        [StringLength(100, MinimumLength = 3)]
        public string Title { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }
    }
}
