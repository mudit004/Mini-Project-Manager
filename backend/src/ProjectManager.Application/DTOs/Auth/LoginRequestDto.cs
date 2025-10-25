// src/ProjectManager.Application/DTOs/Auth/LoginRequestDto.cs
using System.ComponentModel.DataAnnotations;

namespace ProjectManager.Application.DTOs.Auth
{
    public class LoginRequestDto
    {
        [Required]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }
}
