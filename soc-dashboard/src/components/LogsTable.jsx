import React, { useState, useMemo } from 'react'
import { Search, ChevronDown, AlertOctagon, Filter } from 'lucide-react'
import SeverityBadge from './SeverityBadge'
import ActionButtons from './ActionButtons'
import EventDetailModal from './EventDetailModal'
import { getSeverity, formatTimestamp, isSuspicious, describeEventCode } from '../utils'

const SEVERITY_OPTIONS = ['all', 'critical', 'high', 'medium', 'low']

export default function LogsTable({ logs, loading }) {
  const [search, setSearch]           = useState('')
  const [sevFilter, setSevFilter]     = useState('all')
  const [selectedLog, setSelectedLog] = useState(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return logs.filter(log => {
      const sev = getSeverity(log)
      if (sevFilter !== 'all' && sev !== sevFilter) return false
      if (!q) return true
      return (
        String(log.hostname   || '').toLowerCase().includes(q) ||
        String(log.message    || '').toLowerCase().includes(q) ||
        String(log.event_code || '').toLowerCase().includes(q)
      )
    })
  }, [logs, search, sevFilter])

  const critCount = filtered.filter(l => getSeverity(l) === 'critical').length
  const highCount = filtered.filter(l => getSeverity(l) === 'high').length

  return (
    <>
      <div className="panel-card flex flex-col overflow-hidden">

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-gray-900 text-base">Event Logs</h2>
              <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#f1f5f9', color: '#64748b' }}>
                {filtered.length.toLocaleString()} events
              </span>
              {critCount > 0 && (
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                  {critCount} critical
                </span>
              )}
              {highCount > 0 && (
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }}>
                  {highCount} high
                </span>
              )}
            </div>
            <span className="text-slate-400 text-[10px] font-medium tracking-wide hidden sm:block">CLICK ROW TO INSPECT</span>
          </div>

          {/* Filters row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search hostname, event ID, message…"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl outline-none transition-all"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#374151' }}
                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Severity pill filters */}
            <div className="flex items-center gap-1">
              <Filter size={12} className="text-slate-400 mr-1" />
              {SEVERITY_OPTIONS.map(s => {
                const active = sevFilter === s
                const colors = {
                  all: { bg: '#f1f5f9', active: '#1e40af', activeBg: '#dbeafe', border: '#e2e8f0', activeBorder: '#bfdbfe' },
                  critical: { bg: '#fef2f2', active: '#dc2626', activeBg: '#fee2e2', border: '#fecaca', activeBorder: '#fca5a5' },
                  high:     { bg: '#fff7ed', active: '#ea580c', activeBg: '#fed7aa', border: '#fed7aa', activeBorder: '#fdba74' },
                  medium:   { bg: '#fefce8', active: '#ca8a04', activeBg: '#fef08a', border: '#fef08a', activeBorder: '#fde047' },
                  low:      { bg: '#eff6ff', active: '#2563eb', activeBg: '#dbeafe', border: '#bfdbfe', activeBorder: '#93c5fd' },
                }[s]
                return (
                  <button
                    key={s}
                    onClick={() => setSevFilter(s)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                    style={{
                      background: active ? colors.activeBg : colors.bg,
                      color: active ? colors.active : '#64748b',
                      border: `1px solid ${active ? colors.activeBorder : colors.border}`,
                    }}
                  >
                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────── */}
        <div className="overflow-auto flex-1" style={{ maxHeight: '520px' }}>
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-white" style={{ boxShadow: '0 1px 0 #f1f5f9' }}>
              <tr>
                {['Timestamp','Hostname','Event ID','Message','Severity','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap"
                      style={{ fontSize: '10px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                      <span className="text-xs">Loading events…</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-slate-400 text-xs">
                    No events match the current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((log, idx) => {
                  const susp = isSuspicious(log.message)
                  const sev  = getSeverity(log)
                  return (
                    <tr
                      key={log.id ?? idx}
                      className={`transition-colors cursor-pointer ${susp ? 'row-suspicious' : 'row-normal'}`}
                      style={{ borderBottom: '1px solid #f1f5f9' }}
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap" style={{ fontSize: '11px' }}>
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {susp && <AlertOctagon size={11} className="text-red-500 flex-shrink-0" />}
                          <span className="font-semibold text-gray-800 truncate max-w-[120px]" style={{ fontSize: '12px' }}>
                            {log.hostname || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-gray-700" style={{ fontSize: '12px' }}>{log.event_code || '—'}</span>
                        <div className="text-slate-400 mt-0.5" style={{ fontSize: '10px' }}>{describeEventCode(log.event_code)}</div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <span className={`truncate block text-[12px] ${susp ? 'text-red-700 font-semibold' : 'text-slate-600'}`}>
                          {log.message || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <SeverityBadge severity={sev} />
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        {/* ✅ Pass hostname explicitly */}
                        <ActionButtons
                          hostname={log.hostname}
                          log={log}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <EventDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </>
  )
}
