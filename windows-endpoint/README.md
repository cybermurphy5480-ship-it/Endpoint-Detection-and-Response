# Windows Endpoint Setup Guide

This guide explains how to configure a Windows endpoint for the SOC/EDR platform.

## Overview

The endpoint performs:
- Sysmon telemetry collection
- Winlogbeat log forwarding
- Active response actions using `agent.py`

---

## Components Installed

The Windows endpoint uses:

| Component    | Purpose                      |
| ------------ | ---------------------------- |
| Sysmon       | Advanced Windows telemetry   |
| Winlogbeat   | Forward logs to Logstash     |
| Python Agent | Execute SOC response actions |

---

## Prerequisites

- Windows 10/11 or Windows Server 2016+
- Administrator privileges
- Network connectivity to SOC server
- Python 3.8 or higher

---

## Installation Steps

### 1. Install Sysmon

#### Download Sysmon

Official Microsoft Sysinternals Sysmon:

https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon

Download and extract `Sysmon.zip`

Example location:
```
C:\SOC\Sysmon\
```

#### Create Sysmon Configuration

Download a file `sysmonconfig-export.xml` in `C:\SOC\Sysmon\` from https://github.com/SwiftOnSecurity/sysmon-config


#### Install Sysmon

Open Command Prompt as Administrator:

```cmd
cd C:\SOC\Sysmon
Sysmon64.exe -i sysmonconfig.xml
```

Accept the EULA when prompted.

#### Verify Sysmon Installation

Open Event Viewer:
```
Applications and Services Logs
→ Microsoft
→ Windows
→ Sysmon
→ Operational
```

You should see:
- Process creation logs
- Network connections
- Registry activity
- File activity

---

### 2. Install Winlogbeat

#### Download Winlogbeat

Official Elastic download:
https://www.elastic.co/downloads/beats/winlogbeat

Extract to:
```
C:\Program Files\Winlogbeat\
```

#### Configure Winlogbeat

Edit `winlogbeat.yml` in the Winlogbeat directory.

**Configure Logstash Output:**


```yaml
output.logstash:
  hosts: ["YOUR_LINUX_SERVER_IP:5044"]
```

⚠️ **Important:** Replace `YOUR_LINUX_SERVER_IP` with your actual Linux SOC server IP address.


#### Start Winlogbeat

Open PowerShell as Administrator:

```powershell
cd "C:\Program Files\Winlogbeat"
.\winlogbeat.exe -e
```

You should see:
- Successful Logstash connection
- Event forwarding messages

---

### 3. Install Python

#### Download Python

Download from: https://www.python.org/downloads/

**During installation:**
- ✅ Check "Add Python to PATH"

#### Verify Installation

```powershell
python --version
```

---

### 4. Install Agent Dependencies

Install the required Python library:

```powershell
pip install requests
```

---

### 5. Configure and Run Agent

#### Place Agent File

Place `agent.py` in:
```
C:\SOC\
```

#### Configure Backend IP

Edit `agent.py` and update the server address:

```python
SERVER = "http://YOUR_LINUX_SERVER_IP:8000"
```

⚠️ **Important:** Replace `YOUR_LINUX_SERVER_IP` with your actual Linux SOC server IP address.

#### Run the Agent

Open PowerShell as Administrator:

```powershell
cd C:\SOC
python agent.py
```

Keep this PowerShell window open for the agent to continue running.

---

## Agent Features

The agent supports the following response actions:

| Action             | Description                      |
| ------------------ | -------------------------------- |
| kill_process       | Terminates running process       |
| block_executable   | Prevents executable from running |
| unblock_executable | Removes block                    |
| shutdown           | Shutdown endpoint                |

### How Blocking Works

The agent maintains a blocked process list.

Blocked executables are:
- Continuously monitored
- Automatically terminated if launched

Example blocked processes:
- `cmd.exe`
- `powershell.exe`

This simulates lightweight EDR prevention behavior.

---

## Troubleshooting

### Winlogbeat Connection Failed

**Check:**
Verify this inside the winlogbeat.yaml file
- Linux server IP address is correct
- Port 5044 is open on Linux server
- Logstash is running on Linux server

**Test connectivity:**
```powershell
Test-NetConnection -ComputerName YOUR_LINUX_SERVER_IP -Port 5044
```

### Agent Cannot Reach Backend

**Check:**
- FastAPI is running on Linux server:
  ```bash
  uvicorn main:app --host 0.0.0.0 --port 8000
  ```
- Linux firewall allows port 8000
- Windows firewall allows outbound connections

**Test connectivity:**
```powershell
Test-NetConnection -ComputerName YOUR_LINUX_SERVER_IP -Port 8000
```

### Endpoint Not Appearing in Dashboard

**Verify:**
- Winlogbeat is running and forwarding logs
- Sysmon is generating events
- `agent.py` is running
- Logs are visible in the backend database

**Generate test event:**
```powershell
notepad.exe  # Should create a process creation event
```

---

## Generated Telemetry

The endpoint sends the following types of events:

- Process creation events
- PowerShell execution
- CMD execution
- Failed login attempts
- Service creation
- Registry modifications
- Network connections
- User activity

---

## Running Agent as a Service (Optional)

### Using Task Scheduler

To run the agent automatically at startup:

```powershell
$action = New-ScheduledTaskAction -Execute "python" -Argument "C:\SOC\agent.py" -WorkingDirectory "C:\SOC"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -TaskName "SOC Response Agent" -Description "SOC/EDR Response Agent"
```

Start the task:
```powershell
Start-ScheduledTask -TaskName "SOC Response Agent"
```

---

## Security Note

⚠️ **Important:** This project is intended for:

- Educational labs
- SOC simulation
- Cybersecurity learning
- Incident response testing

**Do not deploy in production environments** without proper hardening and authentication.

---
-

**Happy monitoring! 🔒**
