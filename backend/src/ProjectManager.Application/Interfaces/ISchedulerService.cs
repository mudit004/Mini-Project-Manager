// src/ProjectManager.Application/Interfaces/ISchedulerService.cs

using ProjectManager.Application.DTOs.Schedule;
using System.Threading.Tasks;

namespace ProjectManager.Application.Interfaces
{
    public interface ISchedulerService
    {
        Task<ScheduleResponseDto> GenerateScheduleAsync(ScheduleRequestDto request, int userId);
    }
}
