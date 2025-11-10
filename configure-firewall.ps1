# Script para configurar el Firewall de Windows para Nexus
# Ejecutar como Administrador

Write-Host "🔥 Configurando Firewall de Windows para Nexus..." -ForegroundColor Cyan
Write-Host ""

# Verificar si se está ejecutando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ Error: Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host ""
    Write-Host "Cómo ejecutar como Administrador:" -ForegroundColor Yellow
    Write-Host "1. Abre PowerShell como Administrador (clic derecho → 'Ejecutar como administrador')" -ForegroundColor Yellow
    Write-Host "2. Navega a esta carpeta: cd 'C:\Users\luiso\OneDrive\Desktop\Proyecto_Nexus'" -ForegroundColor Yellow
    Write-Host "3. Ejecuta: .\configure-firewall.ps1" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit
}

Write-Host "✅ Ejecutando con privilegios de administrador" -ForegroundColor Green
Write-Host ""

# Eliminar reglas existentes si existen
Write-Host "🧹 Eliminando reglas antiguas (si existen)..." -ForegroundColor Yellow
Remove-NetFirewallRule -DisplayName "Nexus Backend" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Nexus Frontend" -ErrorAction SilentlyContinue
Write-Host "✅ Listo" -ForegroundColor Green
Write-Host ""

# Crear regla para el Backend (puerto 5000)
Write-Host "🔓 Permitiendo puerto 5000 (Backend)..." -ForegroundColor Cyan
try {
    New-NetFirewallRule -DisplayName "Nexus Backend" `
                        -Direction Inbound `
                        -LocalPort 5000 `
                        -Protocol TCP `
                        -Action Allow `
                        -Profile Any `
                        -Enabled True | Out-Null
    Write-Host "✅ Puerto 5000 permitido" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al configurar puerto 5000: $_" -ForegroundColor Red
}
Write-Host ""

# Crear regla para el Frontend (puerto 5173)
Write-Host "🔓 Permitiendo puerto 5173 (Frontend)..." -ForegroundColor Cyan
try {
    New-NetFirewallRule -DisplayName "Nexus Frontend" `
                        -Direction Inbound `
                        -LocalPort 5173 `
                        -Protocol TCP `
                        -Action Allow `
                        -Profile Any `
                        -Enabled True | Out-Null
    Write-Host "✅ Puerto 5173 permitido" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al configurar puerto 5173: $_" -ForegroundColor Red
}
Write-Host ""

# Mostrar IPs de red local
Write-Host "📱 Tus IPs de red local:" -ForegroundColor Cyan
Write-Host ""

$adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" }
foreach ($adapter in $adapters) {
    $ip = $adapter.IPAddress
    Write-Host "   Frontend: http://$ip:5173" -ForegroundColor White
    Write-Host "   Backend:  http://$ip:5000" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "🎉 Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Inicia el backend:  cd backend && npm run dev" -ForegroundColor White
Write-Host "2. Inicia el frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "3. Accede desde tu celular u otro dispositivo usando una de las IPs de arriba" -ForegroundColor White
Write-Host ""
Write-Host "💡 Consejo: Usa la IP que comienza con 192.168.1.x (es tu WiFi principal)" -ForegroundColor Cyan
Write-Host ""

pause
