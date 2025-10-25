// src/ProjectManager.API/Controllers/TasksController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManager.Application.DTOs.Tasks;
using ProjectManager.Application.Interfaces;
using System.Security.Claims;

namespace ProjectManager.API.Controllers
{
    [ApiController]
    [Route("api/projects/{projectId}/tasks")]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;
        private readonly ILogger<TasksController> _logger;

        public TasksController(ITaskService taskService, ILogger<TasksController> logger)
        {
            _taskService = taskService;
            _logger = logger;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                throw new UnauthorizedAccessException("User ID not found in token.");
            return int.Parse(userIdClaim);
        }

        /// <summary>
        /// Get all tasks for a specific project
        /// </summary>
        /// <param name="projectId">The ID of the project</param>
        /// <returns>List of tasks in the project</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskDto>>> GetProjectTasks(int projectId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var tasks = await _taskService.GetProjectTasksAsync(projectId, userId);
                return Ok(tasks);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(ex, "Unauthorized access to project {ProjectId}", projectId);
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tasks for project {ProjectId}", projectId);
                return StatusCode(500, new { message = "An error occurred while retrieving tasks" });
            }
        }

        /// <summary>
        /// Get a specific task by ID
        /// </summary>
        [HttpGet("{taskId}")]
        public async Task<ActionResult<TaskDto>> GetTask(int projectId, int taskId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var task = await _taskService.GetTaskByIdAsync(taskId, userId);
                
                if (task == null)
                {
                    return NotFound(new { message = "Task not found" });
                }

                // Verify the task belongs to the specified project
                if (task.ProjectId != projectId)
                {
                    return NotFound(new { message = "Task not found in this project" });
                }

                return Ok(task);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving task {TaskId}", taskId);
                return StatusCode(500, new { message = "An error occurred while retrieving the task" });
            }
        }


        /// <summary>
        /// Create a new task in a project
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<TaskDto>> CreateTask(int projectId, [FromBody] CreateTaskDto createDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var task = await _taskService.CreateTaskAsync(projectId, createDto, userId);
                return CreatedAtAction(nameof(GetTask), new { projectId = projectId, taskId = task.Id }, task);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating task in project {ProjectId}", projectId);
                return StatusCode(500, new { message = "An error occurred while creating the task" });
            }
        }
    }

    [ApiController]
    [Route("api/tasks")]
    [Authorize]
    public class TaskManagementController : ControllerBase
    {
        private readonly ITaskService _taskService;
        private readonly ILogger<TaskManagementController> _logger;

        public TaskManagementController(ITaskService taskService, ILogger<TaskManagementController> logger)
        {
            _taskService = taskService;
            _logger = logger;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim ?? "0");
        }

        /// <summary>
        /// Update a task
        /// </summary>
        [HttpPut("{taskId}")]
        public async Task<ActionResult<TaskDto>> UpdateTask(int taskId, [FromBody] UpdateTaskDto updateDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var task = await _taskService.UpdateTaskAsync(taskId, updateDto, userId);

                if (task == null)
                {
                    return NotFound(new { message = "Task not found" });
                }

                return Ok(task);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task {TaskId}", taskId);
                return StatusCode(500, new { message = "An error occurred while updating the task" });
            }
        }
        
                /// <summary>
        /// Delete a task
        /// </summary>
        [HttpDelete("{taskId}")]
        public async Task<ActionResult> DeleteTask(int taskId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _taskService.DeleteTaskAsync(taskId, userId);
                
                if (!result)
                {
                    return NotFound(new { message = "Task not found" });
                }

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting task {TaskId}", taskId);
                return StatusCode(500, new { message = "An error occurred while deleting the task" });
            }
        }

    }
}