$ports = @(3000, 3001, 5173, 5174)

foreach ($port in $ports) {
    Write-Host "Checking port $port..."

    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

    if ($connections) {
        foreach ($conn in $connections) {
            $pid = $conn.OwningProcess
            if ($pid) {
                Write-Host "Killing PID $pid on port $port"
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        }
    }
    else {
        Write-Host "Port $port is free."
    }
}

Write-Host "Done. You can now run the backend and frontend again."
Write-Host "Backend: cd .\server; npm run dev"
Write-Host "Frontend: cd .\client; npm run dev -- --host 0.0.0.0"
