@echo off
chcp 65001 > nul
title Configurar IP Estático e Firewall (Rede Apucarana)

:: Verifica se está rodando como Administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Solicitando permissões de Administrador (UAC)...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"
echo ======================================================================
echo   CONFIGURANDO IP ESTÁTICO (192.168.0.11) E FIREWALL (PORTAS 1935 / 8888)
echo ======================================================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0tv-server\set-static-ip.ps1"

echo.
echo Processo concluído! Pressione qualquer tecla para fechar esta janela...
pause > nul
