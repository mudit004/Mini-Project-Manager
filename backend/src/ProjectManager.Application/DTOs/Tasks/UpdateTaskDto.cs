// src/ProjectManager.Application/DTOs/Tasks/UpdateTaskDto.cs
using System.ComponentModel.DataAnnotations;
using ProjectManager.Application.Validators;

namespace ProjectManager.Application.DTOs.Tasks
{
    public class UpdateTaskDto
    {
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [StringLength(2000)]
        public string? Description { get; set; }

        [Required]
        [FutureDate(ErrorMessage = "Due date must be today or in the future")]
        public DateTime DueDate { get; set; }

        [Required]
        public bool IsCompleted { get; set; }
    }
}
