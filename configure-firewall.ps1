# Script para configurar el Firewall de Windows para Nexus
# Ejecutar como Administrador

WriteHost "🔥 Configurando Firewall de Windows para Nexus..." ForegroundColor Cyan
WriteHost ""

# Verificar si se está ejecutando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (not $isAdmin) {
    WriteHost "❌ Error: Este script debe ejecutarse como Administrador" ForegroundColor Red
    WriteHost ""
    WriteHost "Cómo ejecutar como Administrador:" ForegroundColor Yellow
    WriteHost "1. Abre PowerShell como Administrador (clic derecho → 'Ejecutar como administrador')" ForegroundColor Yellow
    WriteHost "2. Navega a esta carpeta: cd 'C:\Users\luiso\OneDrive\Desktop\Proyecto_Nexus'" ForegroundColor Yellow
    WriteHost "3. Ejecuta: .\configurefirewall.ps1" ForegroundColor Yellow
    WriteHost ""
    pause
    exit
}

WriteHost "✅ Ejecutando con privilegios de administrador" ForegroundColor Green
WriteHost ""

# Eliminar reglas existentes si existen
WriteHost "🧹 Eliminando reglas antiguas (si existen)..." ForegroundColor Yellow
RemoveNetFirewallRule DisplayName "Nexus Backend" ErrorAction SilentlyContinue
RemoveNetFirewallRule DisplayName "Nexus Frontend" ErrorAction SilentlyContinue
WriteHost "✅ Listo" ForegroundColor Green
WriteHost ""

# Crear regla para el Backend (puerto 5000)
WriteHost "🔓 Permitiendo puerto 5000 (Backend)..." ForegroundColor Cyan
try {
    NewNetFirewallRule DisplayName "Nexus Backend" `
                        Direction Inbound `
                        LocalPort 5000 `
                        Protocol TCP `
                        Action Allow `
                        Profile Any `
                        Enabled True | OutNull
    WriteHost "✅ Puerto 5000 permitido" ForegroundColor Green
} catch {
    WriteHost "❌ Error al configurar puerto 5000: $_" ForegroundColor Red
}
WriteHost ""

# Crear regla para el Frontend (puerto 5173)
WriteHost "🔓 Permitiendo puerto 5173 (Frontend)..." ForegroundColor Cyan
try {
    NewNetFirewallRule DisplayName "Nexus Frontend" `
                        Direction Inbound `
                        LocalPort 5173 `
                        Protocol TCP `
                        Action Allow `
                        Profile Any `
                        Enabled True | OutNull
    WriteHost "✅ Puerto 5173 permitido" ForegroundColor Green
} catch {
    WriteHost "❌ Error al configurar puerto 5173: $_" ForegroundColor Red
}
WriteHost ""

# Mostrar IPs de red local
WriteHost "📱 Tus IPs de red local:" ForegroundColor Cyan
WriteHost ""

$adapters = GetNetIPAddress AddressFamily IPv4 | WhereObject { $_.IPAddress notlike "127.*" }
foreach ($adapter in $adapters) {
    $ip = $adapter.IPAddress
    WriteHost "   Frontend: http://$ip:5173" ForegroundColor White
    WriteHost "   Backend:  http://$ip:5000" ForegroundColor Gray
    WriteHost ""
}

WriteHost "🎉 Configuración completada!" ForegroundColor Green
WriteHost ""
WriteHost "📋 Próximos pasos:" ForegroundColor Yellow
WriteHost "1. Inicia el backend:  cd backend && npm run dev" ForegroundColor White
WriteHost "2. Inicia el frontend: cd frontend && npm run dev" ForegroundColor White
WriteHost "3. Accede desde tu celular u otro dispositivo usando una de las IPs de arriba" ForegroundColor White
WriteHost ""
WriteHost "💡 Consejo: Usa la IP que comienza con 192.168.1.x (es tu WiFi principal)" ForegroundColor Cyan
WriteHost ""

pause

