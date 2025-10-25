// src/ProjectManager.Application/DTOs/Tasks/CreateTaskDto.cs
using System.ComponentModel.DataAnnotations;
using ProjectManager.Application.Validators;

namespace ProjectManager.Application.DTOs.Tasks
{
    public class CreateTaskDto
    {
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        [Required]
        [FutureDate(ErrorMessage = "Due date must be today or in the future")]
        public DateTime? DueDate { get; set; }
    }
}
