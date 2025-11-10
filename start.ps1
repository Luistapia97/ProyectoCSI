# Script para iniciar el proyecto Nexus
WriteHost ">> Iniciando Proyecto Nexus..." ForegroundColor Cyan
WriteHost ""

# Verificar que las dependencias esten instaladas
if (not (TestPath "backend\node_modules")) {
    WriteHost "ERROR  Dependencias del backend no instaladas. Ejecuta: .\install.ps1" ForegroundColor Red
    exit 1
}

if (not (TestPath "frontend\node_modules")) {
    WriteHost "ERROR  Dependencias del frontend no instaladas. Ejecuta: .\install.ps1" ForegroundColor Red
    exit 1
}

# Verificar archivo .env
if (not (TestPath "backend\.env")) {
    WriteHost "AVISO  Archivo .env no encontrado. Creando desde .env.example..." ForegroundColor Yellow
    CopyItem "backend\.env.example" "backend\.env"
    WriteHost "AVISO  Por favor configura las variables en backend\.env antes de continuar" ForegroundColor Yellow
    exit 1
}

WriteHost "OK  Configuracion verificada" ForegroundColor Green
WriteHost ""
WriteHost "Iniciando servidores..." ForegroundColor Yellow
WriteHost ""
WriteHost "  Backend:  http://localhost:5000" ForegroundColor Cyan
WriteHost "  Frontend: http://localhost:5173" ForegroundColor Cyan
WriteHost ""
WriteHost "Presiona Ctrl+C para detener ambos servidores" ForegroundColor Yellow
WriteHost ""

# Iniciar backend en segundo plano
$backendJob = StartJob ScriptBlock {
    SetLocation $using:PWD\backend
    npm run dev
}

# Esperar un momento para que el backend inicie
StartSleep Seconds 3

# Iniciar frontend en segundo plano
$frontendJob = StartJob ScriptBlock {
    SetLocation $using:PWD\frontend
    npm run dev
}

WriteHost "OK  Servidores iniciados" ForegroundColor Green
WriteHost ""
WriteHost "Mostrando logs..." ForegroundColor Yellow
WriteHost ""

# Mostrar logs de ambos trabajos
try {
    while ($true) {
        $backendOutput = ReceiveJob Job $backendJob ErrorAction SilentlyContinue
        $frontendOutput = ReceiveJob Job $frontendJob ErrorAction SilentlyContinue
        
        if ($backendOutput) {
            WriteHost "[BACKEND] $backendOutput" ForegroundColor Blue
        }
        
        if ($frontendOutput) {
            WriteHost "[FRONTEND] $frontendOutput" ForegroundColor Magenta
        }
        
        StartSleep Milliseconds 500
    }
} finally {
    # Limpiar trabajos al salir
    StopJob Job $backendJob, $frontendJob
    RemoveJob Job $backendJob, $frontendJob
    WriteHost ""
    WriteHost "Servidores detenidos" ForegroundColor Yellow
}

