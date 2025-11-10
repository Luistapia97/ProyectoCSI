# Script para instalar dependencias del proyecto Nexus
WriteHost ">> Instalando Proyecto Nexus..." ForegroundColor Cyan
WriteHost ""

# Verificar Node.js
WriteHost "[1/4] Verificando Node.js..." ForegroundColor Yellow
try {
    $nodeVersion = node version
    WriteHost "  OK  Node.js $nodeVersion instalado" ForegroundColor Green
} catch {
    WriteHost "  ERROR  Node.js no esta instalado. Por favor instala Node.js 18+ desde https://nodejs.org" ForegroundColor Red
    exit 1
}

# Verificar MongoDB
WriteHost ""
WriteHost "[2/4] Verificando MongoDB..." ForegroundColor Yellow
try {
    $mongoVersion = mongod version
    WriteHost "  OK  MongoDB instalado" ForegroundColor Green
} catch {
    WriteHost "  AVISO  MongoDB no encontrado. Puedes usar MongoDB Atlas (cloud) o instalar MongoDB localmente" ForegroundColor Yellow
}

# Instalar dependencias del backend
WriteHost ""
WriteHost "[3/4] Instalando dependencias del backend..." ForegroundColor Yellow
SetLocation backend
npm install
if ($LASTEXITCODE eq 0) {
    WriteHost "  OK  Dependencias del backend instaladas" ForegroundColor Green
} else {
    WriteHost "  ERROR  Error instalando dependencias del backend" ForegroundColor Red
    exit 1
}

# Crear archivo .env si no existe
if (not (TestPath ".env")) {
    WriteHost ""
    WriteHost "  Creando archivo .env..." ForegroundColor Yellow
    CopyItem ".env.example" ".env"
    WriteHost "  OK  Archivo .env creado. Por favor configura las variables de entorno" ForegroundColor Green
}

# Instalar dependencias del frontend
WriteHost ""
WriteHost "[4/4] Instalando dependencias del frontend..." ForegroundColor Yellow
SetLocation ../frontend
npm install
if ($LASTEXITCODE eq 0) {
    WriteHost "  OK  Dependencias del frontend instaladas" ForegroundColor Green
} else {
    WriteHost "  ERROR  Error instalando dependencias del frontend" ForegroundColor Red
    exit 1
}

SetLocation ..

WriteHost ""
WriteHost "=====================================" ForegroundColor Green
WriteHost "  INSTALACION COMPLETADA CON EXITO" ForegroundColor Green
WriteHost "=====================================" ForegroundColor Green
WriteHost ""
WriteHost "Proximos pasos:" ForegroundColor Cyan
WriteHost "  1. Configura las variables de entorno en backend/.env" ForegroundColor White
WriteHost "  2. Asegurate de que MongoDB este corriendo" ForegroundColor White
WriteHost "  3. Ejecuta: .\start.ps1" ForegroundColor White
WriteHost ""
WriteHost "Lee el README.md para mas informacion" ForegroundColor Yellow

