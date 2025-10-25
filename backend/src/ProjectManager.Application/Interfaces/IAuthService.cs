// src/ProjectManager.Application/Interfaces/IAuthService.cs
using ProjectManager.Application.DTOs.Auth;

namespace ProjectManager.Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);
        Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
        Task<string> GenerateJwtTokenAsync(Domain.Entities.User user);
    }
}
