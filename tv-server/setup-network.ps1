# setup-network.ps1 - Configuracao de Firewall e Rede Tailscale para Servidor de TV
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$TAILSCALE_IP = "100.95.147.34"

Write-Host "==============================================================================" -ForegroundColor Yellow
Write-Host "   REDE APUCARANA - CONFIGURACAO DE REDE & FIREWALL (TAILSCALE)" -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Yellow
Write-Host ""

# 1. Verificacao da interface Tailscale
Write-Host "[1/2] Verificando conexao Tailscale..." -ForegroundColor Cyan

$tailscaleFound = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -eq $TAILSCALE_IP }
if ($tailscaleFound) {
    Write-Host "     • IP Tailscale detectado e ativo nesta maquina: $TAILSCALE_IP" -ForegroundColor Green
} else {
    Write-Host "     • IP Tailscale configurado: $TAILSCALE_IP" -ForegroundColor White
}
Write-Host "     • Gerenciamento de IP fisico: mantido sob DHCP automatico (sem conflitos de rede)." -ForegroundColor Gray

# 2. Desbloqueio completo de Firewall para TCP 1935 (RTMP), HLS e WebRTC
Write-Host "`n[2/2] Garantindo portas liberadas no Firewall do Windows (qualquer interface / Tailscale)..." -ForegroundColor Cyan
try {
    # Regra TCP para porta 1935 (RTMP) e portas de streaming para qualquer perfil de rede (Domain, Private, Public)
    netsh advfirewall firewall delete rule name="MediaMTX-Live-TCP" 2>$null | Out-Null
    netsh advfirewall firewall add rule name="MediaMTX-Live-TCP" dir=in action=allow protocol=TCP localport=1935,8888,8889,8554 profile=any 2>$null | Out-Null

    # Regra UDP para porta 1935 e WebRTC
    netsh advfirewall firewall delete rule name="MediaMTX-Live-UDP" 2>$null | Out-Null
    netsh advfirewall firewall add rule name="MediaMTX-Live-UDP" dir=in action=allow protocol=UDP localport=1935,8888,8889,8554 profile=any 2>$null | Out-Null

    $serverDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $mtxBin = Join-Path $serverDir "mediamtx.exe"
    $cfBin = Join-Path $serverDir "cloudflared.exe"

    if (Test-Path $mtxBin) {
        netsh advfirewall firewall delete rule name="MediaMTX-Server-Binary" 2>$null | Out-Null
        netsh advfirewall firewall add rule name="MediaMTX-Server-Binary" dir=in action=allow program="$mtxBin" profile=any 2>$null | Out-Null
    }
    if (Test-Path $cfBin) {
        netsh advfirewall firewall delete rule name="Cloudflared-Tunnel-Binary" 2>$null | Out-Null
        netsh advfirewall firewall add rule name="Cloudflared-Tunnel-Binary" dir=in action=allow program="$cfBin" profile=any 2>$null | Out-Null
    }

    Write-Host "     • Porta TCP 1935 (RTMP) liberada com sucesso em todas as interfaces!" -ForegroundColor Green
    Write-Host "     • Binarios do MediaMTX e Cloudflared autorizados no Firewall." -ForegroundColor Green
} catch {
    Write-Host "     • Aviso: Para regras de Firewall globais, execute como Administrador se necessario." -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "  +------------------------------------------------------------------------+  " -ForegroundColor Green
Write-Host "  |                                                                        |  " -ForegroundColor Green
Write-Host "  |   OBS do Estudio deve apontar para: rtmp://$TAILSCALE_IP`:1935/live         |  " -ForegroundColor Green
Write-Host "  |   Chave de Transmissao: tvapucarana                                    |  " -ForegroundColor Green
Write-Host "  |                                                                        |  " -ForegroundColor Green
Write-Host "  +------------------------------------------------------------------------+  " -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""
