// src/ProjectManager.Domain/Common/BaseEntity.cs
using System.ComponentModel.DataAnnotations;

namespace ProjectManager.Domain.Common
{
    public abstract class BaseEntity
    {
        [Key]
        public int Id { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime? ModifiedDate { get; set; }
    }
}
