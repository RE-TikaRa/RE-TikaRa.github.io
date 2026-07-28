$ErrorActionPreference = 'SilentlyContinue'
# 杀掉占用 4321/4322 的监听进程,以及所有 astro preview/dev node 实例
$ports = 4321, 4322, 4337
foreach ($p in $ports) {
  Get-NetTCPConnection -LocalPort $p -State Listen |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { Stop-Process -Id $_ -Force }
}
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
  Where-Object { $_.CommandLine -match 'astro (preview|dev)' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Write-Output 'killed'
