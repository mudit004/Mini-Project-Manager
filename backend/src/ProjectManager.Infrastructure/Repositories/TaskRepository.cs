// src/ProjectManager.Infrastructure/Repositories/TaskRepository.cs
using Microsoft.EntityFrameworkCore;
using ProjectManager.Domain.Entities;
using ProjectManager.Domain.Interfaces;
using ProjectManager.Infrastructure.Data;

namespace ProjectManager.Infrastructure.Repositories
{
    public class TaskRepository : GenericRepository<ProjectTask>, ITaskRepository
    {
        public TaskRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<ProjectTask>> GetProjectTasksAsync(int projectId)
        {
            return await _dbSet
                .Where(t => t.ProjectId == projectId)
                .Include(t => t.Project)
                .OrderByDescending(t => t.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<ProjectTask>> GetUserTasksAsync(int userId)
        {
            return await _dbSet
                .Where(t => t.Project.UserId == userId)
                .Include(t => t.Project)
                .OrderByDescending(t => t.CreatedDate)
                .ToListAsync();
        }

        public async Task<ProjectTask?> GetTaskByIdAsync(int taskId, int userId)
        {
            return await _dbSet
                .Include(t => t.Project)
                .FirstOrDefaultAsync(t => t.Id == taskId && t.Project.UserId == userId);
        }

        public async Task<bool> IsTaskOwnerAsync(int taskId, int userId)
        {
            return await _dbSet
                .AnyAsync(t => t.Id == taskId && t.Project.UserId == userId);
        }
    }
}

