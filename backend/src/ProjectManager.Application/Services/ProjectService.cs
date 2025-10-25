// src/ProjectManager.Application/Services/ProjectService.cs
using AutoMapper;
using ProjectManager.Application.DTOs.Projects;
using ProjectManager.Application.Interfaces;
using ProjectManager.Domain.Entities;
using ProjectManager.Domain.Interfaces;

namespace ProjectManager.Application.Services
{
    public class ProjectService : IProjectService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ProjectService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<IEnumerable<ProjectDto>> GetUserProjectsAsync(int userId)
        {
            var projects = await _unitOfWork.Projects.GetUserProjectsAsync(userId);
            return _mapper.Map<IEnumerable<ProjectDto>>(projects);
        }

        public async Task<ProjectDto?> GetProjectByIdAsync(int projectId, int userId)
        {
            var project = await _unitOfWork.Projects.GetUserProjectByIdAsync(projectId, userId);
            return project != null ? _mapper.Map<ProjectDto>(project) : null;
        }

        public async Task<ProjectDto> CreateProjectAsync(CreateProjectDto createDto, int userId)
        {
            var project = _mapper.Map<Project>(createDto);
            project.UserId = userId;

            await _unitOfWork.Projects.AddAsync(project);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<ProjectDto>(project);
        }

        public async Task<bool> DeleteProjectAsync(int projectId, int userId)
        {
            var project = await _unitOfWork.Projects.GetUserProjectByIdAsync(projectId, userId);
            if (project == null)
                return false;

            await _unitOfWork.Projects.DeleteAsync(project);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }
    }
}
