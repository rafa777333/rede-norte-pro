@echo off
chcp 65001 > nul
title Indexador Google - Rede Apucarana
color 0B

:inicio
cls
echo =========================================================================
echo   🚀 REDE APUCARANA - INDEXADOR GOOGLE INSTANTÂNEO (Indexing API)
echo =========================================================================
echo.
echo Cole abaixo a URL completa da materia, vaga ou pagina (ou apenas o slug):
echo Exemplo: https://www.redeapucarana.com.br/noticia/minha-materia
echo Exemplo: /empregos
echo.
set /p link="Cole o Link / Slug aqui e aperte Enter: "

if "%link%"=="" (
    echo.
    echo [Aviso] Nenhum link informado!
    timeout /t 2 > nul
    goto inicio
)

echo.
echo =========================================================================
echo   Enviando solicitacao para o Google...
echo =========================================================================
echo.

cd /d "%~dp0"
node scripts/indexar.js %link%

echo.
echo =========================================================================
echo [1] Indexar outro link
echo [2] Sair
echo =========================================================================
set /p opcao="Escolha [1 ou 2]: "

if "%opcao%"=="1" goto inicio
if "%opcao%"=="2" exit
exit
