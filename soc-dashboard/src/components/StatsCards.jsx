import React from 'react'
import { Database, AlertTriangle, Monitor, ShieldAlert } from 'lucide-react'

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000   // 300 000 ms — must match EndpointPanel

function isOnline(ep) {
  if (ep.status !== 'online') return false
  if (!ep.last_seen) return false
  return Date.now() - new Date(ep.last_seen).getTime() < ONLINE_THRESHOLD_MS
}

function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor }) {
  return (
    <div className="stat-card flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 font-mono leading-none">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export default function StatsCards({ logs, endpoints }) {
  const total = logs.length

  const suspicious = logs.filter(l => {
    const msg = String(l.message || '').toLowerCase()
    return /powershell|mimikatz|\-enc|cmd\.exe|whoami|bypass|invoke-expression|downloadstring/.test(msg)
  }).length

  const activeEndpoints = endpoints.filter(isOnline).length

  const highSev = logs.filter(l => {
    const code = String(l.event_code || '')
    const critical = ['4625','4648','4719','4964','1102','4720','4728','4732','4756']
    const high     = ['4688','4697','7045','4698','4702','4704','4705']
    const msg      = String(l.message || '').toLowerCase()
    const isSusp   = /powershell|mimikatz|\-enc|cmd\.exe|whoami|bypass/.test(msg)
    return isSusp || critical.includes(code) || high.includes(code)
  }).length

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={Database}
        label="Total Logs"
        value={total.toLocaleString()}
        sub="collected this session"
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
      />
      <StatCard
        icon={AlertTriangle}
        label="Suspicious Events"
        value={suspicious.toLocaleString()}
        sub={suspicious > 0 ? 'requires investigation' : 'no threats detected'}
        iconBg="bg-red-50"
        iconColor="text-red-600"
      />
      <StatCard
        icon={Monitor}
        label="Active Endpoints"
        value={`${activeEndpoints} / ${endpoints.length}`}
        sub={`${endpoints.length - activeEndpoints} offline`}
        iconBg="bg-green-50"
        iconColor="text-green-600"
      />
      <StatCard
        icon={ShieldAlert}
        label="High Severity"
        value={highSev.toLocaleString()}
        sub="critical + high events"
        iconBg="bg-orange-50"
        iconColor="text-orange-600"
      />
    </div>
  )
}
