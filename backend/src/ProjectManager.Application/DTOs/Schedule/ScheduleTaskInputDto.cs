// src/ProjectManager.Application/DTOs/Schedule/ScheduleTaskInputDto.cs

using System.Collections.Generic;

namespace ProjectManager.Application.DTOs.Schedule
{
    public class ScheduleTaskInputDto
    {
        public string Title { get; set; } = string.Empty;
        public int EstimatedHours { get; set; }
        public string DueDate { get; set; } = string.Empty;
        public List<string> Dependencies { get; set; } = new();
    }
}
