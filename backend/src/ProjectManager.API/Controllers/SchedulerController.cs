// src/ProjectManager.API/Controllers/SchedulerController.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManager.Application.DTOs.Schedule;
using ProjectManager.Application.Interfaces;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProjectManager.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1/projects/{projectId}/schedule")]
    public class SchedulerController : ControllerBase
    {
        private readonly ISchedulerService _schedulerService;

        public SchedulerController(ISchedulerService schedulerService)
        {
            _schedulerService = schedulerService;
        }

        /// <summary>
        /// Generate optimized task schedule based on dependencies
        /// </summary>
        /// <param name="projectId">Project ID</param>
        /// <param name="request">List of tasks with dependencies</param>
        /// <returns>Recommended task execution order</returns>
        [HttpPost]
        public async Task<ActionResult<ScheduleResponseDto>> GenerateSchedule(
            int projectId, 
            [FromBody] ScheduleRequestDto request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            var result = await _schedulerService.GenerateScheduleAsync(request, userId);

            if (result.HasCycle)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}
