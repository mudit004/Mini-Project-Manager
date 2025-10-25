// src/ProjectManager.Domain/Interfaces/ITaskRepository.cs
using ProjectManager.Domain.Entities;

namespace ProjectManager.Domain.Interfaces
{
    public interface ITaskRepository : IGenericRepository<ProjectTask>
    {
        Task<IEnumerable<ProjectTask>> GetProjectTasksAsync(int projectId);
        Task<IEnumerable<ProjectTask>> GetUserTasksAsync(int userId);
        Task<ProjectTask?> GetTaskByIdAsync(int taskId, int userId);
        Task<bool> IsTaskOwnerAsync(int taskId, int userId);
    }
}
