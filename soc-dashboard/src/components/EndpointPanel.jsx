import React from 'react'
import { Monitor, Wifi, WifiOff, Clock } from 'lucide-react'
import { timeAgo } from '../utils'

// An endpoint is considered online only if:
//   1. backend says status === 'online', AND
//   2. last_seen is within the past 5 minutes
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000   // 300 000 ms

function isOnline(endpoint) {
  if (endpoint.status !== 'online') return false
  if (!endpoint.last_seen) return false
  return Date.now() - new Date(endpoint.last_seen).getTime() < ONLINE_THRESHOLD_MS
}

function EndpointCard({ endpoint, eventCount }) {
  const online = isOnline(endpoint)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${online ? 'bg-green-50' : 'bg-gray-100'}`}>
            <Monitor size={15} className={online ? 'text-green-600' : 'text-gray-400'} />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900 leading-tight">{endpoint.hostname || 'Unknown'}</p>
            <p className="font-mono text-xs text-gray-400 mt-0.5">{endpoint.ip || '—'}</p>
          </div>
        </div>

        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {online
            ? <><Wifi size={10} /><span>Online</span></>
            : <><WifiOff size={10} /><span>Offline</span></>
          }
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Events</p>
          <p className="font-mono font-bold text-gray-800">{eventCount ?? 0}</p>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Last Seen</p>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            <Clock size={10} className="text-gray-400" />
            {timeAgo(endpoint.last_seen)}
          </p>
        </div>
      </div>

      {endpoint.os && (
        <p className="text-[10px] text-gray-400 mt-2 truncate">{endpoint.os}</p>
      )}
    </div>
  )
}

export default function EndpointPanel({ endpoints, logs }) {
  // Count events per hostname
  const eventCounts = {}
  logs.forEach(l => {
    if (l.hostname) eventCounts[l.hostname] = (eventCounts[l.hostname] || 0) + 1
  })

  if (!endpoints.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 text-center text-gray-400 text-sm">
        <Monitor size={24} className="mx-auto mb-2 text-gray-300" />
        No endpoints registered.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm text-gray-800">Endpoints</h2>
        <span className="text-xs text-gray-400">{endpoints.filter(isOnline).length} online</span>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {endpoints.map((ep, i) => (
          <EndpointCard
            key={ep.id ?? ep.hostname ?? i}
            endpoint={ep}
            eventCount={eventCounts[ep.hostname]}
          />
        ))}
      </div>
    </div>
  )
}
