# Stage 1: build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["ProjectManager.API/ProjectManager.API.csproj", "ProjectManager.API/"]
RUN dotnet restore "ProjectManager.API/ProjectManager.API.csproj"
COPY . .
WORKDIR "/src/ProjectManager.API"
RUN dotnet build "ProjectManager.API.csproj" -c Release -o /app/build
RUN dotnet publish "ProjectManager.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
# Expose the port your app listens on (optional, Render autodetects)
EXPOSE 5293
ENTRYPOINT ["dotnet", "ProjectManager.API.dll"]
