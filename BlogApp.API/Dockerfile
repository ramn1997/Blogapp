# ─── Build Stage ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy everything first (needed since assets are platform-specific)
COPY . .

# Restore, build, and publish in one clean step (avoids cross-platform NuGet cache issue)
RUN dotnet publish "BlogApp.API.csproj" -c Release -o /app/publish

# ─── Runtime Stage ────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

EXPOSE 8080

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "BlogApp.API.dll"]
