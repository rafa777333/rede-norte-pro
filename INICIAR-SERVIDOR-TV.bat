@echo off
chcp 65001 >nul
title Servidor de TV Rede Apucarana - Transmissao Ao Vivo
cd /d "%~dp0"

REM 1. Checa se ja esta rodando como Administrador
net session >nul 2>&1
if %errorlevel% == 0 goto :RUN_SETUP

REM Se recebeu argumento de fallback, nao tenta elevar novamente
if "%1"=="noadmin" goto :RUN_SETUP

cls
echo ==============================================================================
echo   REDE APUCARANA - SOLICITANDO PRIVILEGIOS DE ADMINISTRADOR
echo ==============================================================================
echo.
echo   Para liberar a porta TCP 1935 no Firewall do Windows (Tailscale e rede local),
echo   este inicializador precisa de autorizacao de Administrador.
echo.
echo   Por favor, clique em "SIM" na janela do Windows que acaba de aparecer...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd.exe -ArgumentList '/k cd /d ^\"\"%~dp0^\"\" ^&^& ^\"\"%~f0^\"\"' -Verb RunAs" 2>nul
if %errorlevel% == 0 exit /b

echo [AVISO] Nao foi possivel abrir com elevacao UAC. Continuando normalmente...
timeout /t 2 >nul

:RUN_SETUP
cls
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tv-server\setup-network.ps1"

echo.
echo ==============================================================================
echo   INICIANDO TRANSMISSAO: MEDIAMTX + CLOUDFLARE TUNNEL (REDE APUCARANA)
echo ==============================================================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"
    if exist "C:\Program Files (x86)\nodejs\node.exe" set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
)

node tv-server/start-tv-server.js

if %errorlevel% neq 0 (
    echo.
    echo ==============================================================================
    echo   [AVISO] O servidor de transmissao foi encerrado.
    echo ==============================================================================
    echo.
    pause
)
