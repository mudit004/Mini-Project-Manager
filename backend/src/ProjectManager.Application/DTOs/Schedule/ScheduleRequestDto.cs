// src/ProjectManager.Application/DTOs/Schedule/ScheduleRequestDto.cs

using System.Collections.Generic;

namespace ProjectManager.Application.DTOs.Schedule
{
    public class ScheduleRequestDto
    {
        public List<ScheduleTaskInputDto> Tasks { get; set; } = new();
    }
}
