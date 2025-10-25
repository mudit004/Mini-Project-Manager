// src/ProjectManager.Application/Services/SchedulerService.cs

using ProjectManager.Application.DTOs.Schedule;
using ProjectManager.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectManager.Application.Services
{
    public class SchedulerService : ISchedulerService
    {
        public Task<ScheduleResponseDto> GenerateScheduleAsync(ScheduleRequestDto request, int userId)
        {
            var response = new ScheduleResponseDto();

            try
            {
                // Build dependency graph
                var graph = BuildGraph(request.Tasks);
                var inDegree = CalculateInDegree(graph, request.Tasks);

                // Topological sort with Kahn's algorithm
                var result = TopologicalSort(graph, inDegree, request.Tasks);

                if (result == null)
                {
                    response.HasCycle = true;
                    response.ErrorMessage = "Circular dependency detected. Cannot schedule tasks.";
                    return Task.FromResult(response);
                }

                response.RecommendedOrder = result;
                response.HasCycle = false;
            }
            catch (Exception ex)
            {
                response.ErrorMessage = $"Scheduling failed: {ex.Message}";
            }

            return Task.FromResult(response);
        }

        private Dictionary<string, List<string>> BuildGraph(List<ScheduleTaskInputDto> tasks)
        {
            var graph = new Dictionary<string, List<string>>();

            // Initialize graph with all tasks
            foreach (var task in tasks)
            {
                if (!graph.ContainsKey(task.Title))
                {
                    graph[task.Title] = new List<string>();
                }
            }

            // Add edges for dependencies
            foreach (var task in tasks)
            {
                foreach (var dependency in task.Dependencies)
                {
                    if (graph.ContainsKey(dependency))
                    {
                        graph[dependency].Add(task.Title);
                    }
                }
            }

            return graph;
        }

        private Dictionary<string, int> CalculateInDegree(
            Dictionary<string, List<string>> graph, 
            List<ScheduleTaskInputDto> tasks)
        {
            var inDegree = new Dictionary<string, int>();

            // Initialize in-degree for all tasks
            foreach (var task in tasks)
            {
                inDegree[task.Title] = 0;
            }

            // Calculate in-degree
            foreach (var task in tasks)
            {
                foreach (var dependency in task.Dependencies)
                {
                    if (inDegree.ContainsKey(task.Title))
                    {
                        inDegree[task.Title]++;
                    }
                }
            }

            return inDegree;
        }

        private List<string>? TopologicalSort(
            Dictionary<string, List<string>> graph,
            Dictionary<string, int> inDegree,
            List<ScheduleTaskInputDto> tasks)
        {
            var result = new List<string>();
            var taskMap = tasks.ToDictionary(t => t.Title);

            // Priority queue: tasks with 0 in-degree, sorted by estimated hours (shortest first)
            var queue = new SortedSet<(int estimatedHours, string title)>(
                Comparer<(int, string)>.Create((a, b) =>
                {
                    var cmp = a.Item1.CompareTo(b.Item1);
                    return cmp != 0 ? cmp : string.Compare(a.Item2, b.Item2, StringComparison.Ordinal);
                })
            );

            // Add tasks with no dependencies
            foreach (var kvp in inDegree.Where(kvp => kvp.Value == 0))
            {
                var estimatedHours = taskMap.ContainsKey(kvp.Key) ? taskMap[kvp.Key].EstimatedHours : 0;
                queue.Add((estimatedHours, kvp.Key));
            }

            while (queue.Count > 0)
            {
                // Get task with shortest estimated hours
                var current = queue.Min;
                queue.Remove(current);
                result.Add(current.title);

                // Reduce in-degree for dependent tasks
                if (graph.ContainsKey(current.title))
                {
                    foreach (var neighbor in graph[current.title])
                    {
                        inDegree[neighbor]--;
                        if (inDegree[neighbor] == 0)
                        {
                            var estimatedHours = taskMap.ContainsKey(neighbor) ? taskMap[neighbor].EstimatedHours : 0;
                            queue.Add((estimatedHours, neighbor));
                        }
                    }
                }
            }

            // Check for cycle
            if (result.Count != tasks.Count)
            {
                return null; // Cycle detected
            }

            return result;
        }
    }
}
