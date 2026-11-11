# Script de Configuração de IP Estático e Firewall para TV Rede Apucarana
# Requer Privilégios de Administrador

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  CONFIGURANDO IP ESTÁTICO (192.168.0.11) E FIREWALL - REDE APUCARANA" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Localiza a interface de rede ativa na faixa 192.168.0.x
$adapter = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | 
    Where-Object { $_.IPAddress -like "192.168.0.*" } | 
    Select-Object -First 1

if (-not $adapter) {
    # Tenta localizar interface Ethernet ou Wi-Fi conectada
    $adapter = Get-NetAdapter -Physical | Where-Object { $_.Status -eq "Up" } | Select-Object -First 1
    if ($adapter) {
        $alias = $adapter.Name
    } else {
        $alias = "Ethernet 4"
    }
} else {
    $alias = $adapter.InterfaceAlias
}

Write-Host "[1/3] Interface de rede detectada: $alias" -ForegroundColor Yellow

# 2. Configura IP estático, máscara, gateway e DNS via netsh
Write-Host "[2/3] Aplicando IP 192.168.0.11 / Mascara 255.255.255.0 / Gateway 192.168.0.1..." -ForegroundColor Yellow
netsh interface ipv4 set address name="$alias" static 192.168.0.11 255.255.255.0 192.168.0.1 1
netsh interface ipv4 set dns name="$alias" static 8.8.8.8 primary
netsh interface ipv4 add dns name="$alias" 1.1.1.1 index=2

# 3. Libera portas 1935 (RTMP) e 8888 (HLS) no Firewall do Windows
Write-Host "[3/3] Liberando portas 1935 e 8888 no Firewall do Windows..." -ForegroundColor Yellow
netsh advfirewall firewall delete rule name="Servidor TV RTMP (1935)" 2>$null
netsh advfirewall firewall add rule name="Servidor TV RTMP (1935)" dir=in action=allow protocol=TCP localport=1935

netsh advfirewall firewall delete rule name="Servidor TV HLS (8888)" 2>$null
netsh advfirewall firewall add rule name="Servidor TV HLS (8888)" dir=in action=allow protocol=TCP localport=8888

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "  ✅ SUCESSO! IP ESTÁTICO 192.168.0.11 E FIREWALL APLICADOS COM ÊXITO!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 3
