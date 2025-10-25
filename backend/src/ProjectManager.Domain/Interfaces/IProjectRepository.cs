// src/ProjectManager.Domain/Interfaces/IProjectRepository.cs
using ProjectManager.Domain.Entities;

namespace ProjectManager.Domain.Interfaces
{
    public interface IProjectRepository : IGenericRepository<Project>
    {
        Task<IEnumerable<Project>> GetUserProjectsAsync(int userId);
        Task<Project?> GetUserProjectByIdAsync(int projectId, int userId);
        Task<bool> IsProjectOwnerAsync(int projectId, int userId);
    }
}
