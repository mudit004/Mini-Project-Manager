// src/ProjectManager.Application/Interfaces/ITaskService.cs
using ProjectManager.Application.DTOs.Tasks;

namespace ProjectManager.Application.Interfaces
{
    public interface ITaskService
    {
        Task<IEnumerable<TaskDto>> GetProjectTasksAsync(int projectId, int userId);
        Task<TaskDto?> GetTaskByIdAsync(int taskId, int userId);
        Task<TaskDto> CreateTaskAsync(int projectId, CreateTaskDto createDto, int userId);
        Task<TaskDto?> UpdateTaskAsync(int taskId, UpdateTaskDto updateDto, int userId);
        Task<bool> DeleteTaskAsync(int taskId, int userId);
    }
}
