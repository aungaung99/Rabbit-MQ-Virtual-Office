FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["RabbitMqVirtualOffice.slnx", "./"]
COPY ["src/Contracts/Contracts.csproj", "src/Contracts/"]
COPY ["src/Application/Application.csproj", "src/Application/"]
COPY ["src/Infrastructure/Infrastructure.csproj", "src/Infrastructure/"]
COPY ["src/Api/Api.csproj", "src/Api/"]
COPY ["tests/Api.Tests/Api.Tests.csproj", "tests/Api.Tests/"]
RUN dotnet restore RabbitMqVirtualOffice.slnx

COPY . .
WORKDIR /src/src/Api
RUN dotnet publish Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Api.dll"]
