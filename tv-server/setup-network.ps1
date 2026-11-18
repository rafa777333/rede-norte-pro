# setup-network.ps1 - Configuracao blindada de IP Fixo e Firewall para o Servidor de TV
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==============================================================================" -ForegroundColor Yellow
Write-Host "   REDE APUCARANA - CONFIGURANDO REDE E BLINDAGEM DE IP (.240)" -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Yellow
Write-Host ""

# 1. Identificar interface ativa e Gateway (ignora VPNs e adaptadores virtuais)
Write-Host "[1/4] Identificando interface de rede fisica ativa..." -ForegroundColor Cyan

$route = Get-NetRoute -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue | 
    Where-Object { $_.NextHop -ne '0.0.0.0' -and $_.NextHop -notlike '26.*' } | 
    Sort-Object RouteMetric | 
    Select-Object -First 1

if ($route) {
    $adapter = Get-NetAdapter -InterfaceIndex $route.InterfaceIndex -ErrorAction SilentlyContinue
    $gw = $route.NextHop
} else {
    $adapter = Get-NetAdapter -ErrorAction SilentlyContinue | 
        Where-Object { $_.Status -eq 'Up' -and $_.InterfaceDescription -notlike '*VPN*' -and $_.InterfaceDescription -notlike '*Virtual*' -and $_.InterfaceDescription -notlike '*Loopback*' } | 
        Sort-Object -Property LinkSpeed -Descending | 
        Select-Object -First 1
    $gw = '192.168.0.1'
}

if (-not $adapter) {
    $ifName = 'Ethernet 4'
    $gw = '192.168.0.1'
} else {
    $ifName = $adapter.Name
}

# 2. Calcular o IP Estatico na faixa .240 (fora do DHCP para evitar conflitos)
$prefix = $gw.Substring(0, $gw.LastIndexOf('.') + 1)
$newIp = $prefix + "240"
$mask = "255.255.255.0"

Write-Host "     • Interface ativa detectada: $ifName" -ForegroundColor White
Write-Host "     • Gateway do Roteador:       $gw" -ForegroundColor White
Write-Host "     • IP Estático Seguro:        $newIp (Final .240 - Protegido contra DHCP)" -ForegroundColor Green

# 3. Aplicar IP Estatico e DNS caso necessario
Write-Host "`n[2/4] Aplicando IP estatico e servidores DNS..." -ForegroundColor Cyan

$currentIpObj = Get-NetIPAddress -InterfaceAlias $ifName -AddressFamily IPv4 -ErrorAction SilentlyContinue | Select-Object -First 1
$currentIp = if ($currentIpObj) { $currentIpObj.IPAddress } else { "" }

if ($currentIp -eq $newIp) {
    Write-Host "     • O IP desta máquina já está fixado em $newIp. Perfeito!" -ForegroundColor Green
} else {
    try {
        Write-Host "     • Alterando IP de [$currentIp] para [$newIp]..." -ForegroundColor Yellow
        netsh interface ip set address name="$ifName" static $newIp $mask $gw 1 | Out-Null
        netsh interface ip set dns name="$ifName" static 8.8.8.8 | Out-Null
        netsh interface ip add dns name="$ifName" 1.1.1.1 index=2 | Out-Null
        Write-Host "     • IP e DNS aplicados com sucesso na interface [$ifName]!" -ForegroundColor Green
    } catch {
        Write-Host "     • Aviso: Para aplicar IP estático, certifique-se de executar como Administrador." -ForegroundColor DarkYellow
    }
}

# 4. Limpeza de cache de rede
Write-Host "`n[3/4] Limpando tabela ARP e cache DNS para derrubar conflitos anteriores..." -ForegroundColor Cyan
try {
    ipconfig /flushdns | Out-Null
    arp -d * 2>$null | Out-Null
    Write-Host "     • Cache ARP e DNS limpos com sucesso!" -ForegroundColor Green
} catch {}

# 5. Desbloqueio de Firewall
Write-Host "`n[4/4] Garantindo portas de streaming liberadas no Firewall do Windows..." -ForegroundColor Cyan
try {
    netsh advfirewall firewall delete rule name="MediaMTX-Live-TCP" 2>$null | Out-Null
    netsh advfirewall firewall add rule name="MediaMTX-Live-TCP" dir=in action=allow protocol=TCP localport=1935,8888,8889,8554 profile=any 2>$null | Out-Null

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
    Write-Host "     • Portas 1935 (RTMP), 8888 (HLS), 8889 (WebRTC) e 8554 (RTSP) liberadas!" -ForegroundColor Green
} catch {
    Write-Host "     • Aviso ao configurar Firewall: execute como Administrador se necessário." -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "  +------------------------------------------------------------------------+  " -ForegroundColor Green
Write-Host "  |                                                                        |  " -ForegroundColor Green
Write-Host "  |   CONFIGURACAO NO OBS STUDIO DO ESTUDIO (Transmissao):                 |  " -ForegroundColor Green
Write-Host "  |                                                                        |  " -ForegroundColor Green
Write-Host "  |   • Servico:              Personalizado... (Custom)                    |  " -ForegroundColor Green
Write-Host "  |   • Servidor:             rtmp://$newIp`:1935/live                     |  " -ForegroundColor Green
Write-Host "  |   • Chave de Transmissao: tvapucarana                                  |  " -ForegroundColor Green
Write-Host "  |                                                                        |  " -ForegroundColor Green
Write-Host "  +------------------------------------------------------------------------+  " -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""
