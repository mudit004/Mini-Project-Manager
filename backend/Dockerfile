# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy the project file and restore dependencies
COPY ["src/ProjectManager.API/ProjectManager.API.csproj", "ProjectManager.API/"]
WORKDIR /src/ProjectManager.API
RUN dotnet restore "ProjectManager.API.csproj"

# Copy all source files
COPY src/ProjectManager.API/. ./
RUN dotnet build "ProjectManager.API.csproj" -c Release -o /app/build

# Publish for production
RUN dotnet publish "ProjectManager.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copy published output
COPY --from=build /app/publish ./

# Expose port (match your app’s binding)
EXPOSE 5293
ENV ASPNETCORE_URLS=http://*:${PORT:-5293}

ENTRYPOINT ["dotnet", "ProjectManager.API.dll"]
