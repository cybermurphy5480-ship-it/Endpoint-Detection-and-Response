import React, { useState, useEffect, useCallback } from 'react'
import Navbar from './components/Navbar'
import StatsCards from './components/StatsCards'
import LogsTable from './components/LogsTable'
import EndpointPanel from './components/EndpointPanel'
import ErrorBanner from './components/ErrorBanner'
import { fetchLogs, fetchEndpoints } from './api'
import { formatTimestamp } from './utils'

const REFRESH_INTERVAL = 3000

const MOCK_LOGS = [
  { id: 1,  timestamp: new Date(Date.now() - 4000).toISOString(),   hostname: 'DESKTOP-WIN10',  event_code: '1',    message: 'powershell.exe -enc SQBFAFYA... (encoded command)', user: 'jdoe' },
  { id: 2,  timestamp: new Date(Date.now() - 12000).toISOString(),  hostname: 'SRV-DC01',       event_code: '4625', message: 'An account failed to log on. User: administrator', user: 'administrator' },
  { id: 3,  timestamp: new Date(Date.now() - 25000).toISOString(),  hostname: 'DESKTOP-WIN10',  event_code: '4688', message: 'cmd.exe /c net user hacker P@ss123 /add', user: 'jdoe' },
  { id: 4,  timestamp: new Date(Date.now() - 40000).toISOString(),  hostname: 'SRV-WEB01',      event_code: '3',    message: 'Network connection to 185.220.101.45:4444', user: 'SYSTEM' },
  { id: 5,  timestamp: new Date(Date.now() - 60000).toISOString(),  hostname: 'DESKTOP-HR01',   event_code: '4624', message: 'An account was successfully logged on. Type: Interactive', user: 'msmith' },
  { id: 6,  timestamp: new Date(Date.now() - 75000).toISOString(),  hostname: 'SRV-DC01',       event_code: '4720', message: 'A user account was created. Account: backup_svc', user: 'administrator' },
  { id: 7,  timestamp: new Date(Date.now() - 90000).toISOString(),  hostname: 'SRV-WEB01',      event_code: '7045', message: 'New service installed: WindowsUpdateHelper, path: C:\\Temp\\update.exe', user: 'SYSTEM' },
  { id: 8,  timestamp: new Date(Date.now() - 120000).toISOString(), hostname: 'DESKTOP-WIN10',  event_code: '13',   message: 'Registry value set: HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\\Updater', user: 'jdoe' },
  { id: 9,  timestamp: new Date(Date.now() - 150000).toISOString(), hostname: 'DESKTOP-HR01',   event_code: '4648', message: 'Logon attempted with explicit credentials. Target: SRV-DC01', user: 'msmith' },
  { id: 10, timestamp: new Date(Date.now() - 180000).toISOString(), hostname: 'SRV-DC01',       event_code: '1102', message: 'The audit log was cleared.', user: 'administrator' },
]

const MOCK_ENDPOINTS = [
  { id: 1, hostname: 'DESKTOP-WIN10', ip: '192.168.1.101', status: 'online',  last_seen: new Date(Date.now() - 5000).toISOString(),   os: 'Windows 10 Pro 22H2', total_events: 150 },
  { id: 2, hostname: 'SRV-DC01',      ip: '192.168.1.10',  status: 'online',  last_seen: new Date(Date.now() - 12000).toISOString(),  os: 'Windows Server 2019', total_events: 89 },
  { id: 3, hostname: 'SRV-WEB01',     ip: '192.168.1.20',  status: 'online',  last_seen: new Date(Date.now() - 30000).toISOString(),  os: 'Windows Server 2022', total_events: 234 },
  { id: 4, hostname: 'DESKTOP-HR01',  ip: '192.168.1.105', status: 'offline', last_seen: new Date(Date.now() - 300000).toISOString(), os: 'Windows 10 Home', total_events: 45 },
]

export default function App() {
  const [logs, setLogs]               = useState([])
  const [endpoints, setEndpoints]     = useState([])
  const [activeCount, setActiveCount] = useState(0)
  const [totalCount, setTotalCount]   = useState(0)
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [error, setError]             = useState(null)
  const [usingMock, setUsingMock]     = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      // Fetch logs
      const logsResponse = await fetchLogs()
      
      // Fetch endpoints - backend returns: { endpoints: [...], total_count: N, active_count: N }
      const endpointsResponse = await fetchEndpoints()
      
      console.log('Backend endpoints response:', endpointsResponse) // Debug log
      
      // Extract the endpoints array and counts from the response
      const endpointsArray = endpointsResponse?.endpoints || endpointsResponse || []
      const active = endpointsResponse?.active_count ?? 0
      const total = endpointsResponse?.total_count ?? endpointsArray.length
      
      console.log('Parsed endpoints:', endpointsArray) // Debug log
      console.log('Active count:', active, 'Total count:', total) // Debug log
      
      setLogs(Array.isArray(logsResponse) ? logsResponse : (logsResponse?.logs || []))
      setEndpoints(Array.isArray(endpointsArray) ? endpointsArray : [])
      setActiveCount(active)
      setTotalCount(total)
      setError(null)
      setUsingMock(false)
      
    } catch (err) {
      console.error('Error loading data:', err)
      if (logs.length === 0) {
        setLogs(MOCK_LOGS)
        setEndpoints(MOCK_ENDPOINTS)
        setActiveCount(MOCK_ENDPOINTS.filter(e => e.status === 'online').length)
        setTotalCount(MOCK_ENDPOINTS.length)
        setUsingMock(true)
      }
      setError(`Cannot reach backend — showing demo data. (${err.message})`)
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLastRefresh(new Date().toLocaleTimeString())
    }
  }, [logs.length])

  useEffect(() => { loadData() }, [])
  useEffect(() => {
    const id = setInterval(() => loadData(false), REFRESH_INTERVAL)
    return () => clearInterval(id)
  }, [loadData])

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <Navbar 
        endpointCount={totalCount} 
        activeCount={activeCount}
        lastRefresh={lastRefresh} 
        refreshing={refreshing} 
        onRefreshNow={() => loadData(true)} 
      />

      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-5">

        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {usingMock && !error && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold"
               style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
            ⚠ Demo mode — connect FastAPI backend at <code className="font-mono mx-1 bg-amber-100 px-1.5 py-0.5 rounded">http://127.0.0.1:8000</code> to see live data.
          </div>
        )}

        <StatsCards 
          logs={logs} 
          endpoints={endpoints} 
          activeCount={activeCount}
          totalCount={totalCount}
        />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
          <div className="xl:col-span-3">
            <LogsTable logs={logs} loading={loading} />
          </div>
          <div className="xl:col-span-1">
            <EndpointPanel 
              endpoints={endpoints} 
              logs={logs}
              activeCount={activeCount}
              totalCount={totalCount}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
