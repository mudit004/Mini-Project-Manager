// src/ProjectManager.Application/Validators/FutureDateAttribute.cs
using System.ComponentModel.DataAnnotations;

namespace ProjectManager.Application.Validators
{
    public class FutureDateAttribute : ValidationAttribute
    {
        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value is DateTime date)
            {
                // Only compare dates, ignore time component
                if (date.Date < DateTime.UtcNow.Date)
                {
                    return new ValidationResult(ErrorMessage ?? "Due date cannot be in the past");
                }
            }
            
            return ValidationResult.Success;
        }
    }
}
