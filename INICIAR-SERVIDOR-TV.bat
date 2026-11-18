@echo off
chcp 65001 >nul
title Servidor de TV Rede Apucarana - Inicializador Inteligente
color 0B

:: ==============================================================================
:: 1. AUTO-ELEVAÇÃO AUTOMÁTICA PARA ADMINISTRADOR (UAC)
:: ==============================================================================
net session >nul 2>&1
if %errorlevel% neq 0 (
    cls
    echo ==============================================================================
    echo   REDE APUCARANA - SOLICITANDO PRIVILÉGIOS DE ADMINISTRADOR (UAC)
    echo ==============================================================================
    echo.
    echo  [AVISO] Para fixar o IP na faixa .240 e liberar o Firewall do Windows,
    echo  este inicializador precisa de permissões de Administrador.
    echo.
    echo  Clique em "SIM" na janela do Windows que acabou de aparecer na sua tela...
    echo.
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

:: Garante execução a partir da pasta raiz do projeto
cd /d "%~dp0"

:: Garante o Node.js no PATH mesmo em sessões restritas
where node >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"
    if exist "C:\Program Files (x86)\nodejs\node.exe" set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
)

cls
echo ==============================================================================
echo   REDE APUCARANA - CONFIGURANDO REDE E BLINDAGEM DE IP (.240)
echo ==============================================================================
echo.

:: ==============================================================================
:: 2. DETECÇÃO DINÂMICA DA INTERFACE DE REDE E CONFIGURAÇÃO DO IP FIXO .240
:: ==============================================================================
echo [1/3] Identificando interface de rede ativa e rota do roteador...

powershell -NoProfile -ExecutionPolicy Bypass -Command "& {
    $route = Get-NetRoute -DestinationPrefix '0.0.0.0/0' | Where-Object { $_.NextHop -ne '0.0.0.0' -and $_.NextHop -notlike '26.*' } | Sort-Object RouteMetric | Select-Object -First 1
    if (-not $route) {
        $adapter = Get-NetAdapter | Where-Object { $_.Status -eq 'Up' -and $_.InterfaceDescription -notlike '*VPN*' -and $_.InterfaceDescription -notlike '*Virtual*' -and $_.InterfaceDescription -notlike '*Loopback*' } | Sort-Object -Property LinkSpeed -Descending | Select-Object -First 1
        $gw = '192.168.0.1'
    } else {
        $adapter = Get-NetAdapter -InterfaceIndex $route.InterfaceIndex
        $gw = $route.NextHop
    }

    if (-not $adapter) {
        $ifName = 'Ethernet 4'
        $gw = '192.168.0.1'
    } else {
        $ifName = $adapter.Name
    }

    $prefix = $gw.Substring(0, $gw.LastIndexOf('.') + 1)
    $newIp = $prefix + '240'
    $mask = '255.255.255.0'

    Write-Host ('     • Interface detectada: ' + $ifName) -ForegroundColor Cyan
    Write-Host ('     • Gateway do roteador: ' + $gw) -ForegroundColor Cyan
    Write-Host ('     • Novo IP Estático:    ' + $newIp + ' (Protegido contra conflitos)') -ForegroundColor Green

    # Aplica IP Estático na interface detectada
    netsh interface ip set address name=`\"$ifName`\" static $newIp $mask $gw 1 | Out-Null

    # Configura servidores DNS confiáveis
    netsh interface ip set dns name=`\"$ifName`\" static 8.8.8.8 | Out-Null
    netsh interface ip add dns name=`\"$ifName`\" 1.1.1.1 index=2 | Out-Null

    # Limpeza de cache ARP e DNS
    ipconfig /flushdns | Out-Null
    arp -d * 2>$null | Out-Null

    # Grava variáveis em arquivo temporário para o Batch consumir
    $envFile = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), 'tv_net_env.bat')
    $content = 'set \"IFACE=' + $ifName + '\"' + [Environment]::NewLine + 'set \"NEW_IP=' + $newIp + '\"' + [Environment]::NewLine + 'set \"GATEWAY=' + $gw + '\"'
    [System.IO.File]::WriteAllText($envFile, $content)
}"

:: Carrega as variáveis de rede detectadas pelo PowerShell
if exist "%TEMP%\tv_net_env.bat" (
    call "%TEMP%\tv_net_env.bat"
    del "%TEMP%\tv_net_env.bat" >nul 2>&1
)

if "%NEW_IP%"=="" set "NEW_IP=192.168.0.240"
if "%GATEWAY%"=="" set "GATEWAY=192.168.0.1"
if "%IFACE%"=="" set "IFACE=Ethernet 4"

echo.
echo [2/3] IP Fixo configurado: %NEW_IP% (Final .240 seguro).
echo [2/3] Tabela ARP e cache DNS limpos com sucesso.
echo.

:: ==============================================================================
:: 3. DESBLOQUEIO AUTOMÁTICO DE REGRAS NO FIREWALL DO WINDOWS
:: ==============================================================================
echo [3/3] Desbloqueando portas no Firewall do Windows (TCP/UDP 1935, 8888, 8889, 8554)...

netsh advfirewall firewall delete rule name="MediaMTX-Live-TCP" >nul 2>&1
netsh advfirewall firewall add rule name="MediaMTX-Live-TCP" dir=in action=allow protocol=TCP localport=1935,8888,8889,8554 profile=any >nul 2>&1

netsh advfirewall firewall delete rule name="MediaMTX-Live-UDP" >nul 2>&1
netsh advfirewall firewall add rule name="MediaMTX-Live-UDP" dir=in action=allow protocol=UDP localport=1935,8888,8889,8554 profile=any >nul 2>&1

if exist "%~dp0tv-server\mediamtx.exe" (
    netsh advfirewall firewall delete rule name="MediaMTX-Server-Binary" >nul 2>&1
    netsh advfirewall firewall add rule name="MediaMTX-Server-Binary" dir=in action=allow program="%~dp0tv-server\mediamtx.exe" profile=any >nul 2>&1
)

if exist "%~dp0tv-server\cloudflared.exe" (
    netsh advfirewall firewall delete rule name="Cloudflared-Tunnel-Binary" >nul 2>&1
    netsh advfirewall firewall add rule name="Cloudflared-Tunnel-Binary" dir=in action=allow program="%~dp0tv-server\cloudflared.exe" profile=any >nul 2>&1
)

:: ==============================================================================
:: 4. PAINEL VISUAL DE TRANSMISSÃO E INICIALIZAÇÃO DO SERVIDOR
:: ==============================================================================
cls
color 0F
echo ==============================================================================
echo      REDE APUCARANA DE COMUNICAÇÃO - SERVIDOR DE TRANSMISSÃO WEB TV
echo ==============================================================================
echo.
echo   [OK] Privilégios de Administrador:     CONFIRMADOS
echo   [OK] Adaptador de Rede Ativo:          %IFACE%
echo   [OK] Gateway do Roteador:              %GATEWAY%
echo   [OK] IP Fixo Blindado (Sem Conflitos): %NEW_IP%
echo   [OK] DNS Primário / Secundário:        8.8.8.8 / 1.1.1.1
echo   [OK] Cache de Rede:                    Limpo e Renovado (ipconfig / flushdns + arp -d)
echo   [OK] Firewall do Windows:              Portas 1935, 8888, 8889, 8554 LIBERADAS
echo.
echo ==============================================================================
echo   +------------------------------------------------------------------------+
echo   ^|                                                                        ^|
echo   ^|   CONFIGURAÇÃO NO OBS STUDIO DO ESTÚDIO (Transmissão):                 ^|
echo   ^|                                                                        ^|
echo   ^|   • Serviço:              Personalizado... (Custom)                    ^|
echo   ^|   • Servidor:             rtmp://%NEW_IP%:1935/live                     ^|
echo   ^|   • Chave de Transmissão: tvapucarana                                  ^|
echo   ^|                                                                        ^|
echo   +------------------------------------------------------------------------+
echo ==============================================================================
echo.
echo   [INICIANDO SERVIÇOS] MediaMTX + Cloudflare Tunnel + Sincronização Supabase...
echo.

node tv-server/start-tv-server.js

if %errorlevel% neq 0 (
    echo.
    echo ==============================================================================
    echo   [ERRO] O servidor foi encerrado ou ocorreu uma falha na execução.
    echo ==============================================================================
    echo.
    echo Pressione qualquer tecla para fechar esta janela...
    pause >nul
)
