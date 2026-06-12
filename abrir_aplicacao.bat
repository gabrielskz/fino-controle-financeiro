@echo off
setlocal
cd /d "%~dp0frontend"

where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo Node.js nao foi encontrado. Instale a versao LTS em https://nodejs.org
  pause
  exit /b 1
)

if not exist ".env.local" (
  echo.
  echo O Supabase ainda nao foi configurado.
  echo Copie frontend\.env.local.example para frontend\.env.local
  echo e preencha as duas chaves. Veja o README.md.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Instalando as bibliotecas pela primeira vez...
  call npm.cmd install --cache ..\.npm-cache
  if errorlevel 1 (
    echo Nao foi possivel instalar as bibliotecas.
    pause
    exit /b 1
  )
)

start "Fino - Aplicacao" /min cmd /c "npm.cmd run dev"
timeout /t 4 /nobreak >nul
start "" http://localhost:3000

