# Script para instalar dependencias del proyecto Nexus
Write-Host ">> Instalando Proyecto Nexus..." -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "[1/4] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  OK - Node.js $nodeVersion instalado" -ForegroundColor Green
} catch {
    Write-Host "  ERROR - Node.js no esta instalado. Por favor instala Node.js 18+ desde https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Verificar MongoDB
Write-Host ""
Write-Host "[2/4] Verificando MongoDB..." -ForegroundColor Yellow
try {
    $mongoVersion = mongod --version
    Write-Host "  OK - MongoDB instalado" -ForegroundColor Green
} catch {
    Write-Host "  AVISO - MongoDB no encontrado. Puedes usar MongoDB Atlas (cloud) o instalar MongoDB localmente" -ForegroundColor Yellow
}

# Instalar dependencias del backend
Write-Host ""
Write-Host "[3/4] Instalando dependencias del backend..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK - Dependencias del backend instaladas" -ForegroundColor Green
} else {
    Write-Host "  ERROR - Error instalando dependencias del backend" -ForegroundColor Red
    exit 1
}

# Crear archivo .env si no existe
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "  Creando archivo .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "  OK - Archivo .env creado. Por favor configura las variables de entorno" -ForegroundColor Green
}

# Instalar dependencias del frontend
Write-Host ""
Write-Host "[4/4] Instalando dependencias del frontend..." -ForegroundColor Yellow
Set-Location ../frontend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK - Dependencias del frontend instaladas" -ForegroundColor Green
} else {
    Write-Host "  ERROR - Error instalando dependencias del frontend" -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  INSTALACION COMPLETADA CON EXITO" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Configura las variables de entorno en backend/.env" -ForegroundColor White
Write-Host "  2. Asegurate de que MongoDB este corriendo" -ForegroundColor White
Write-Host "  3. Ejecuta: .\start.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Lee el README.md para mas informacion" -ForegroundColor Yellow
