# SOC/EDR Dashboard - Real-Time Endpoint Detection & Response Platform

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![React](https://img.shields.io/badge/react-18.x-61dafb.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)

A lightweight Security Operations Center (SOC) and Endpoint Detection and Response (EDR) platform for real-time Windows security monitoring and incident response.

[Features](#features) • [Architecture](#architecture) • [Installation](#installation) • [Usage](#usage)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)

---

## 🔍 Overview

This project is a comprehensive SOC/EDR platform that demonstrates enterprise-grade security monitoring capabilities. It collects Windows security events in real-time, centralizes them on a Linux server, stores them in PostgreSQL, and provides a modern web dashboard for visualization and incident response.

The platform simulates real-world SIEM (Security Information and Event Management), EDR (Endpoint Detection and Response), and SOAR (Security Orchestration, Automation and Response) workflows.

### Main Objectives

1. ✅ **Real-time Log Collection** - Collect Windows security logs via Sysmon and Winlogbeat
2. ✅ **Centralized Storage** - Store events in PostgreSQL on Linux server
3. ✅ **Modern Dashboard** - Visualize security events in real-time
4. ✅ **Threat Detection** - Detect suspicious activities and patterns
5. ✅ **Remote Response** - Execute response actions directly from the dashboard
6. ✅ **EDR Simulation** - Implement endpoint detection and response capabilities

---

## ✨ Features

### 🔐 Security Monitoring
- Real-time Windows event collection (Sysmon + Winlogbeat)
- Process creation monitoring
- Failed login detection
- PowerShell activity tracking
- Command execution logging
- Service installation monitoring
- Registry change detection
- Network connection tracking

### 📊 Dashboard Capabilities
- Modern, dark-themed SOC interface
- Real-time event streaming
- Severity-based event filtering
- Advanced search functionality
- Expandable event details with modal view
- Endpoint status monitoring
- Suspicious pattern highlighting

### 🎯 Incident Response
- **Kill Process** - Terminate malicious processes remotely
- **Block Executable** - Prevent specific executables from running
- **Unblock Executable** - Remove process from blocklist
- **Shutdown Endpoint** - Emergency endpoint shutdown
- Context-aware action buttons (dynamic based on event type)

### 🤖 Endpoint Agent
- Continuous polling for pending actions
- Automatic execution of response commands
- Active process blocking engine
- Real-time status reporting

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Windows VM    │
│                 │
│   ┌─────────┐   │
│   │ Sysmon  │   │
│   └────┬────┘   │
│        │        │
│   ┌────▼─────┐  │      ┌──────────────────────────────┐
│   │Winlogbeat│  │      │      Linux SOC Server        │
│   └────┬─────┘  │      │                              │
└────────┼────────┘      │  ┌────────────────────────┐  │
         │               │  │      Logstash          │  │
         │               │  │   (Port 5044)          │  │
         └──────────────►│  └──────────┬─────────────┘  │
                         │             │                 │
                         │  ┌──────────▼─────────────┐  │
                         │  │   Python Receiver      │  │
                         │  │   (Log Ingestion)      │  │
                         │  └──────────┬─────────────┘  │
                         │             │                 │
                         │  ┌──────────▼─────────────┐  │
                         │  │     PostgreSQL         │  │
                         │  │   (Event Storage)      │  │
                         │  └──────────┬─────────────┘  │
                         │             │                 │
                         │  ┌──────────▼─────────────┐  │
                         │  │   FastAPI Backend      │  │
                         │  │   (Port 8000)          │  │
                         │  └──────────┬─────────────┘  │
                         │             │                 │
                         │  ┌──────────▼─────────────┐  │
                         │  │   React Dashboard      │  │
                         │  │   (Port 5173)          │  │
                         │  └────────────────────────┘  │
                         │                              │
                         └──────────────┬───────────────┘
                                        │
                         ┌──────────────▼───────────────┐
                         │   Windows Response Agent     │
                         │   (Executes Actions)         │
                         └──────────────────────────────┘
```
# System Startup Order

Follow this startup order to run the complete SOC/EDR platform correctly.

---

# 1. Start PostgreSQL

Ensure PostgreSQL service is running.

## Ubuntu / Debian

```
sudo systemctl start postgresql
```

Verify:

```
sudo systemctl status postgresql
```

---

# 2. Start Logstash (Download it from Internet)

Navigate to Logstash directory:

```
cd ~/logstash/bin
```

Start Logstash using Sysmon pipeline configuration:

```
./logstash -f ~/logstash/config/sysmon.conf    // edit server IP

Run-> bin/logstash -f config/sysmon.conf

```

Expected:

* Logstash starts successfully
* Beats input listens on port 5044
* incoming Winlogbeat events appear

---

# 3. Start Winlogbeat (Windows Endpoint)

Open PowerShell as Administrator.

Navigate to Winlogbeat:

```
cd "C:\Program Files\Winlogbeat"
```

Run Winlogbeat:

```
.\winlogbeat.exe -e
```

Expected:

* successful connection to Logstash
* Sysmon logs forwarded to Linux SOC server

---

# 4. Start receiver.py

On Linux SOC server:

Navigate to backend folder:

```
cd ~/makeproject/backend
```

Run receiver:

```
python3 receiver.py
```

Expected:

* receiver listens on port 9999
* incoming logs inserted into PostgreSQL

---

# 5. Start FastAPI Backend

Navigate to backend folder:

```
cd ~/makeproject/backend
```

Run FastAPI server:

```
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Expected:

* backend accessible on port 8000
* Swagger docs available

Open:

```
http://localhost:8000/docs
```

or:

```
http://<SOC-IP>:8000/docs
```

---

# 6. Start React SOC Dashboard

Navigate to frontend directory:

```
cd ~/makeproject/soc-dashboard
```

Install dependencies (first time only):

```
npm install
```

Start dashboard:

```
npm run dev
```

Expected:

* Vite frontend starts
* dashboard available on port 5173

Open:

```
http://localhost:5173
```

---

# 7. Start Windows Response Agent

On Windows endpoint:

Open PowerShell as Administrator.

Navigate to agent directory:

```
cd C:\SOC
```

Run agent:

```
python agent.py
```

Expected:

* agent connects to backend
* endpoint appears in dashboard
* response actions work

---

FILES WHERE IP WAS CHANGED

1. agent.py
2. ActionButtons.jsx
3. api.js 
4. vite.config.js
5. Winlogbeat Configuration

# 8. Verify Complete Pipeline

Test flow:

```
Windows Event
→ Sysmon
→ Winlogbeat
→ Logstash
→ receiver.py
→ PostgreSQL
→ FastAPI
→ React Dashboard
→ agent.py
```

You should now see:

* real-time logs
* endpoint activity
* severity indicators
* response actions
* event details

---

# 9. Recommended Startup Sequence

Start services in this exact order:

1. PostgreSQL
2. Logstash
3. Winlogbeat
4. receiver.py
5. FastAPI backend
6. React dashboard
7. agent.py

This ensures:

* logs are properly ingested
* backend APIs work
* dashboard receives live events
* response actions function correctly

---

# 10. Troubleshooting

## Dashboard Empty

Check:

* Winlogbeat running
* Logstash receiving logs
* receiver.py inserting logs
* PostgreSQL contains events

---

## Agent Not Appearing

Check:

* backend reachable
* correct SOC server IP
* FastAPI running on `0.0.0.0`

---

## API Errors

Verify:

* backend running on port 8000
* frontend API URL correct
* CORS enabled in FastAPI

---

# 11. Ports Used

| Port | Purpose              |
| ---- | -------------------- |
| 5044 | Logstash Beats input |
| 8000 | FastAPI backend      |
| 5173 | React dashboard      |
| 9999 | Python receiver      |

---

## 🛠️ Technologies Used

### Backend
- **Python 3.8+** - Core backend language
- **FastAPI** - Modern web framework for APIs
- **PostgreSQL** - Event storage database
- **psycopg2** - PostgreSQL adapter
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Styling framework
- **Axios** - HTTP client
- **Lucide React** - Icon library

### Log Pipeline
- **Sysmon** - Windows system monitoring
- **Winlogbeat** - Log shipper
- **Logstash** - Log processing pipeline

### Endpoint Response
- **Python Agent** - Response automation
- **Windows Commands** - Process and system control

---

## 📦 Prerequisites

### Linux Server (SOC Server)
- Ubuntu 20.04+ or similar Linux distribution
- Python 3.8 or higher
- PostgreSQL 12+
- Node.js 16+ and npm
- Logstash 8.x
- At least 2GB RAM
- 10GB free disk space

### Windows Endpoint
- Windows 10/11 or Windows Server 2016+
- Sysmon installed and configured
- Winlogbeat 8.x
- Python 3.8+ (for response agent)
- Administrator privileges

---

## 🚀 Installation

For detailed installation instructions, please refer to [docs/INSTALLATION.md](docs/INSTALLATION.md)

### Quick Start

**Linux Server:**
```bash
git clone https://github.com/yourusername/soc-edr-dashboard.git
cd soc-edr-dashboard
# Follow setup instructions in docs/INSTALLATION.md
```

**Windows Endpoint:**
```powershell
# Install Sysmon, Winlogbeat, and configure agent
# See docs/INSTALLATION.md for detailed steps
```

---

## ⚙️ Configuration

### Backend Configuration
Edit `backend/main.py`:
```python
DB_CONFIG = {
    "host": "localhost",
    "database": "soclab",
    "user": "socuser",
    "password": "your_password"
}
```

### Frontend Configuration
Edit `soc-dashboard/src/api.js`:
```javascript
const API_BASE_URL = 'http://YOUR_SERVER_IP:8000';
```

### Windows Agent Configuration
Edit `windows-endpoint/agent.py`:
```python
SERVER = "http://YOUR_SERVER_IP:8000"
```

---

## 📁 Project Structure

```
soc-edr-dashboard/
│
├── backend/                      # Backend services
│   ├── main.py                  # FastAPI application
│   ├── receiver.py              # Log ingestion service
│   ├── requirements.txt         # Python dependencies
│
│
├── soc-dashboard/               # React frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── utils.js             # Utility functions
│   │   ├── api.js               # API client
│   │   └── index.css            # Global styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── windows-endpoint/            # Windows agent and configs
│   ├── agent.py                 # Response agent
│   ├── winlogbeat.yml           # Winlogbeat configuration
│   └── README.md                # Windows setup guide
│
├── docs/                        # Documentation
│   ├── INSTALLATION.md          # Detailed installation guide
│   ├── API.md                   # API documentation
│   └── TROUBLESHOOTING.md       # Common issues and solutions
│
├── .gitignore
├── README.md
└── LICENSE
```

---

## 📡 API Documentation

### Get Security Logs
```http
GET /logs?limit=100
```

### Get Endpoints
```http
GET /endpoints
```

### Submit Action
```http
POST /action
Content-Type: application/json

{
  "hostname": "DESKTOP-ABC123",
  "action": "kill_process",
  "target": "powershell.exe"
}
```

### Get Pending Actions
```http
GET /actions/{hostname}
```

For complete API documentation, see [docs/API.md](docs/API.md)

---

## 🐛 Troubleshooting

Common issues and solutions:

- **Winlogbeat connection issues** - Check firewall and Logstash status
- **Database connection errors** - Verify PostgreSQL credentials
- **Agent not receiving actions** - Check FastAPI backend and network connectivity

For detailed troubleshooting, see [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

---

## 🔮 Future Enhancements

- [ ] MITRE ATT&CK framework mapping
- [ ] Web attack detection
- [ ] IP-based blocking and endpoint isolation
- [ ] Email/SMS alerting system
- [ ] WebSocket for real-time updates
- [ ] Threat intelligence feed integration
- [ ] Machine learning anomaly detection
- [ ] Docker containerization
- [ ] User authentication system
- [ ] Report generation

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👏 Acknowledgments

- Inspired by enterprise SIEM/EDR solutions
- Built as an educational cybersecurity project
- Demonstrates practical SOC workflows

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

Made with ❤️ for the cybersecurity community

</div>
