# Use the official .NET 8 SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy solution file
COPY ProjectManager.sln ./

# Copy all project files for restore
COPY src/ProjectManager.Domain/*.csproj ./src/ProjectManager.Domain/
COPY src/ProjectManager.Infrastructure/*.csproj ./src/ProjectManager.Infrastructure/
COPY src/ProjectManager.Application/*.csproj ./src/ProjectManager.Application/
COPY src/ProjectManager.API/*.csproj ./src/ProjectManager.API/

# Restore dependencies
RUN dotnet restore

# Copy the rest of the source code
COPY src/ ./src/

# Build the application
WORKDIR /app/src/ProjectManager.API
RUN dotnet build -c Release -o /app/build

# Publish the application
RUN dotnet publish -c Release -o /app/publish

# Use the runtime image for the final stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copy the published application from the build stage
COPY --from=build /app/publish .

# Expose the port that Render will use
EXPOSE 8080

# Set environment variables for ASP.NET Core
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Run the application
ENTRYPOINT ["dotnet", "ProjectManager.API.dll"]