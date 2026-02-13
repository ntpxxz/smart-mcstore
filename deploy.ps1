# OneInv Docker Deployment Script
# Usage: .\deploy.ps1 [environment]
# Example: .\deploy.ps1 production

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet('development', 'production', 'staging')]
    [string]$Environment = 'production',
    
    [Parameter(Mandatory = $false)]
    [switch]$Build = $false,
    
    [Parameter(Mandatory = $false)]
    [switch]$NoPull = $false
)

Write-Host "[INFO] OneInv Docker Deployment Script" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host ""

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "[OK] Docker found: $dockerVersion" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Docker is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if docker-compose is available
try {
    $composeVersion = docker compose version
    Write-Host "[OK] Docker Compose found: $composeVersion" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Docker Compose is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Set environment file
$envFile = ".env.$Environment"
if (!(Test-Path $envFile)) {
    Write-Host "[ERROR] Environment file not found: $envFile" -ForegroundColor Red
    Write-Host "   Creating from template..." -ForegroundColor Yellow
    
    if (Test-Path ".env") {
        Copy-Item ".env" $envFile
        Write-Host "[OK] Created $envFile from .env template" -ForegroundColor Green
        Write-Host "[WARN] Please edit $envFile with your configuration" -ForegroundColor Yellow
        exit 0
    }
    else {
        Write-Host "[ERROR] Template .env file not found" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[FILE] Using environment file: $envFile" -ForegroundColor Cyan

# Pull latest code (unless --no-pull)
if (!$NoPull) {
    Write-Host ""
    Write-Host "[PULL] Pulling latest code..." -ForegroundColor Cyan
    git pull
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[WARN] Git pull failed, continuing anyway..." -ForegroundColor Yellow
    }
    else {
        Write-Host "[OK] Code updated" -ForegroundColor Green
    }
}

# Stop existing containers
Write-Host ""
Write-Host "[STOP] Stopping existing containers..." -ForegroundColor Cyan
docker compose --env-file $envFile down
Write-Host "[OK] Containers stopped" -ForegroundColor Green

# Build if requested
if ($Build) {
    Write-Host ""
    Write-Host "[BUILD] Building Docker image..." -ForegroundColor Cyan
    docker compose --env-file $envFile build --no-cache
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Build completed" -ForegroundColor Green
}

# Start containers
Write-Host ""
Write-Host "[INFO] Starting containers..." -ForegroundColor Cyan
docker compose --env-file $envFile up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to start containers" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Containers started" -ForegroundColor Green

# Wait for services to be healthy
Write-Host ""
Write-Host "[WAIT] Waiting for services to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Check container status
Write-Host ""
Write-Host "[STATUS] Container Status:" -ForegroundColor Cyan
docker compose --env-file $envFile ps

# Show logs
Write-Host ""
Write-Host "[LOGS] Recent logs:" -ForegroundColor Cyan
docker compose --env-file $envFile logs --tail=20 app

# Get app URL
Write-Host ""
Write-Host "[OK] Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "[URL] Application URLs:" -ForegroundColor Cyan
Write-Host "   - App: http://localhost:3000" -ForegroundColor White
Write-Host "   - pgAdmin: http://localhost:5050 (if enabled)" -ForegroundColor White
Write-Host ""
Write-Host "[HELP] Useful commands:" -ForegroundColor Cyan
Write-Host "   - View logs: docker compose --env-file $envFile logs -f app" -ForegroundColor White
Write-Host "   - Stop: docker compose --env-file $envFile stop" -ForegroundColor White
Write-Host "   - Restart: docker compose --env-file $envFile restart" -ForegroundColor White
Write-Host "   - Remove: docker compose --env-file $envFile down -v" -ForegroundColor White
Write-Host ""
