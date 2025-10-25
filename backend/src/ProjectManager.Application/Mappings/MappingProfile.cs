// src/ProjectManager.Application/Mappings/MappingProfile.cs
using AutoMapper;
using ProjectManager.Application.DTOs.Projects;
using ProjectManager.Application.DTOs.Tasks;
using ProjectManager.Domain.Entities;

namespace ProjectManager.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Project mappings
            CreateMap<Project, ProjectDto>()
                .ForMember(dest => dest.TaskCount, opt => opt.MapFrom(src => src.Tasks.Count))
                .ForMember(dest => dest.CompletedTaskCount, opt => opt.MapFrom(src => src.Tasks.Count(t => t.IsCompleted)));

            CreateMap<CreateProjectDto, Project>();

            // Task mappings
            CreateMap<ProjectTask, TaskDto>()
                .ForMember(dest => dest.ProjectTitle, opt => opt.MapFrom(src => src.Project.Title));
            
            CreateMap<CreateTaskDto, ProjectTask>();
            CreateMap<UpdateTaskDto, ProjectTask>();
        }
    }
}
