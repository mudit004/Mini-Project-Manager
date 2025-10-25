// src/ProjectManager.Application/DTOs/Schedule/ScheduleResponseDto.cs

using System.Collections.Generic;

namespace ProjectManager.Application.DTOs.Schedule
{
    public class ScheduleResponseDto
    {
        public List<string> RecommendedOrder { get; set; } = new();
        public string? ErrorMessage { get; set; }
        public bool HasCycle { get; set; }
    }
}
