# Script para iniciar el proyecto Nexus
Write-Host ">> Iniciando Proyecto Nexus..." -ForegroundColor Cyan
Write-Host ""

# Verificar que las dependencias esten instaladas
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "ERROR - Dependencias del backend no instaladas. Ejecuta: .\install.ps1" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "ERROR - Dependencias del frontend no instaladas. Ejecuta: .\install.ps1" -ForegroundColor Red
    exit 1
}

# Verificar archivo .env
if (-not (Test-Path "backend\.env")) {
    Write-Host "AVISO - Archivo .env no encontrado. Creando desde .env.example..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "AVISO - Por favor configura las variables en backend\.env antes de continuar" -ForegroundColor Yellow
    exit 1
}

Write-Host "OK - Configuracion verificada" -ForegroundColor Green
Write-Host ""
Write-Host "Iniciando servidores..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Ctrl+C para detener ambos servidores" -ForegroundColor Yellow
Write-Host ""

# Iniciar backend en segundo plano
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\backend
    npm run dev
}

# Esperar un momento para que el backend inicie
Start-Sleep -Seconds 3

# Iniciar frontend en segundo plano
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\frontend
    npm run dev
}

Write-Host "OK - Servidores iniciados" -ForegroundColor Green
Write-Host ""
Write-Host "Mostrando logs..." -ForegroundColor Yellow
Write-Host ""

# Mostrar logs de ambos trabajos
try {
    while ($true) {
        $backendOutput = Receive-Job -Job $backendJob -ErrorAction SilentlyContinue
        $frontendOutput = Receive-Job -Job $frontendJob -ErrorAction SilentlyContinue
        
        if ($backendOutput) {
            Write-Host "[BACKEND] $backendOutput" -ForegroundColor Blue
        }
        
        if ($frontendOutput) {
            Write-Host "[FRONTEND] $frontendOutput" -ForegroundColor Magenta
        }
        
        Start-Sleep -Milliseconds 500
    }
} finally {
    # Limpiar trabajos al salir
    Stop-Job -Job $backendJob, $frontendJob
    Remove-Job -Job $backendJob, $frontendJob
    Write-Host ""
    Write-Host "Servidores detenidos" -ForegroundColor Yellow
}
