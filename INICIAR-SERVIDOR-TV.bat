@echo off
chcp 65001 > nul
title Servidor de TV Rede Apucarana (MediaMTX + Cloudflare Tunnel)
cd /d "%~dp0"

echo ======================================================================
echo   INICIANDO SERVIDOR LOCAL DE TRANSMISSÃO - REDE APUCARANA
echo ======================================================================
echo.

node tv-server/start-tv-server.js

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] O servidor foi encerrado ou o Node.js não foi encontrado.
    echo Pressione qualquer tecla para sair...
    pause > nul
)
