// src/ProjectManager.Application/Services/TaskService.cs
using AutoMapper;
using ProjectManager.Application.DTOs.Tasks;
using ProjectManager.Application.Interfaces;
using ProjectManager.Domain.Entities;
using ProjectManager.Domain.Interfaces;

namespace ProjectManager.Application.Services
{
    public class TaskService : ITaskService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public TaskService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<IEnumerable<TaskDto>> GetProjectTasksAsync(int projectId, int userId)
        {
            // First verify the user owns the project
            if (!await _unitOfWork.Projects.IsProjectOwnerAsync(projectId, userId))
            {
                throw new UnauthorizedAccessException("Project not found or access denied");
            }

            var tasks = await _unitOfWork.Tasks.GetProjectTasksAsync(projectId);
            return _mapper.Map<IEnumerable<TaskDto>>(tasks);
        }

        public async Task<TaskDto?> GetTaskByIdAsync(int taskId, int userId)
        {
            var task = await _unitOfWork.Tasks.GetTaskByIdAsync(taskId, userId);
            if (task == null)
                return null;

            return _mapper.Map<TaskDto>(task);
        }

        public async Task<TaskDto> CreateTaskAsync(int projectId, CreateTaskDto createDto, int userId)
        {
            // Verify the user owns the project
            if (!await _unitOfWork.Projects.IsProjectOwnerAsync(projectId, userId))
            {
                throw new UnauthorizedAccessException("Project not found or access denied");
            }
            if (createDto.DueDate.HasValue && createDto.DueDate.Value.Date < DateTime.UtcNow.Date)
            {
                throw new InvalidOperationException("Due date cannot be set to a past date.");
            }

            var task = _mapper.Map<ProjectTask>(createDto);
            task.ProjectId = projectId;

            await _unitOfWork.Tasks.AddAsync(task);
            await _unitOfWork.SaveChangesAsync();

            // Reload the task with the Project navigation property
            var createdTask = await _unitOfWork.Tasks.GetTaskByIdAsync(task.Id, userId);
            
            return _mapper.Map<TaskDto>(createdTask);
        }

        public async Task<TaskDto?> UpdateTaskAsync(int taskId, UpdateTaskDto updateDto, int userId)
        {
            // if (updateDto.DueDate.HasValue && updateDto.DueDate.Value.Date < DateTime.UtcNow.Date)
            // {
            //     throw new InvalidOperationException("Due date cannot be set to a past date.");
            // }

            var task = await _unitOfWork.Tasks.GetTaskByIdAsync(taskId, userId);
            if (task == null)
                return null;

            _mapper.Map(updateDto, task);

            if (updateDto.IsCompleted && task.CompletedDate == null)
            {
                task.CompletedDate = DateTime.UtcNow;
            }
            else if (!updateDto.IsCompleted)
            {
                task.CompletedDate = null;
            }

            await _unitOfWork.Tasks.UpdateAsync(task);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<TaskDto>(task);
        }

        public async Task<bool> DeleteTaskAsync(int taskId, int userId)
        {
            var task = await _unitOfWork.Tasks.GetTaskByIdAsync(taskId, userId);
            if (task == null)
                return false;

            await _unitOfWork.Tasks.DeleteAsync(task);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }
    }
}
