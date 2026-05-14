# SOC Dashboard — Incident Response & Audit Monitoring

A professional enterprise SOC/SIEM dashboard built with React + Vite + TailwindCSS.

## Stack
- **React 18** + **Vite**
- **TailwindCSS 3**
- **Axios** for API calls
- **Lucide React** for icons

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
# Opens at http://localhost:5173
```

## Backend Connection

The frontend fetches from:
- `GET http://127.0.0.1:8000/logs`       → array of log objects
- `GET http://127.0.0.1:8000/endpoints`  → array of endpoint objects

If the backend is unreachable, demo data is shown automatically.

### Expected Log Object
```json
{
  "id": 1,
  "timestamp": "2026-05-13T10:00:00",
  "hostname": "DESKTOP-1",
  "event_code": "1",
  "message": "powershell -enc AAAA",
  "user": "jdoe",
  "process_name": "powershell.exe"
}
```

### Expected Endpoint Object
```json
{
  "id": 1,
  "hostname": "DESKTOP-1",
  "ip": "192.168.1.101",
  "status": "online",
  "last_seen": "2026-05-13T10:00:00",
  "os": "Windows 10 Pro"
}
```

## Features
- Auto-refresh every 3 seconds
- Search and severity filter on logs table
- Suspicious event highlighting (PowerShell, mimikatz, encoded commands, etc.)
- Expandable log rows with full detail
- Endpoint status panel with event counts
- Block / Allow / Kill Process action buttons (wire up to backend as needed)
- Responsive layout

## Production Build

```bash
npm run build
# Output in ./dist
```
