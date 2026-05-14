import React, { useEffect, useCallback, useState, useRef } from 'react'
import {
  X, Copy, Check, AlertTriangle, Clock, Monitor,
  Hash, User, Network, Terminal, FileText, ShieldAlert
} from 'lucide-react'
import SeverityBadge from './SeverityBadge'
import ActionButtons from './ActionButtons'
import { getSeverity, formatTimestamp, describeEventCode } from '../utils'

const SUSPICIOUS_TOKENS = [
  'powershell','-enc','-encodedcommand','cmd.exe','certutil',
  'mimikatz','vssadmin','whoami','net user','net localgroup',
  'wscript','mshta','regsvr32','bitsadmin','rundll32',
  'bypass','invoke-expression','iex','downloadstring',
  'invoke-webrequest','webclient','shellexecute',
]

function tokenise(text) {
  if (!text) return [{ text: '—', suspicious: false }]
  const escaped = SUSPICIOUS_TOKENS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = []; let last = 0, m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), suspicious: false })
    parts.push({ text: m[0], suspicious: true })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), suspicious: false })
  return parts.length ? parts : [{ text, suspicious: false }]
}

function HighlightedText({ text, mono = false }) {
  return (
    <span className={mono ? 'font-mono' : ''}>
      {tokenise(text).map((p, i) =>
        p.suspicious
          ? <mark key={i} className="rounded px-0.5 font-bold" style={{ background: '#fee2e2', color: '#dc2626' }}>{p.text}</mark>
          : <span key={i}>{p.text}</span>
      )}
    </span>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all"
      style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b' }}
    >
      {copied ? <Check size={9} style={{ color: '#16a34a' }} /> : <Copy size={9} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function Section({ icon: Icon, title, children, accent = false }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${accent ? '#fecaca' : '#e2e8f0'}` }}>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: accent ? '#fef2f2' : '#f8fafc', borderBottom: `1px solid ${accent ? '#fecaca' : '#e2e8f0'}` }}>
        {Icon && <Icon size={12} style={{ color: accent ? '#dc2626' : '#94a3b8' }} />}
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accent ? '#dc2626' : '#64748b' }}>{title}</span>
      </div>
      <div className="px-4 py-3 bg-white">{children}</div>
    </div>
  )
}

function Field({ label, value, mono = false, highlight = false, copyable = false }) {
  if (value === undefined || value === null || value === '') return null
  const strVal = String(value)
  return (
    <div className="grid gap-2 py-2" style={{ gridTemplateColumns: '130px 1fr', borderBottom: '1px solid #f8fafc' }}>
      <span className="text-[11px] text-slate-400 font-semibold pt-px">{label}</span>
      <div className="flex items-start gap-2 min-w-0">
        <span className={`text-[12px] break-all leading-relaxed ${mono ? 'font-mono text-slate-700' : 'text-gray-800'}`}>
          {highlight ? <HighlightedText text={strVal} mono={mono} /> : strVal}
        </span>
        {copyable && <CopyButton text={strVal} />}
      </div>
    </div>
  )
}

function JsonViewer({ data }) {
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(data, null, 2)
  const colourJson = raw => raw
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, '<span class="js">\"$1\"</span>')
    .replace(/\b(\d+\.?\d*)\b(?=\s*[,\}\]])/g, '<span class="jn">$1</span>')
    .replace(/\b(true|false|null)\b/g, '<span class="jk">$1</span>')
    .replace(/<span class="js">"([^"]+)"<\/span>(\s*):/g, '<span class="jkey">"$1"</span>$2:')

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <button onClick={() => navigator.clipboard.writeText(json).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8' }}>
          {copied ? <Check size={9} style={{color:'#4ade80'}} /> : <Copy size={9} />}
          {copied ? 'Copied!' : 'Copy JSON'}
        </button>
      </div>
      <pre className="rounded-xl text-[11px] font-mono p-4 overflow-auto leading-relaxed"
           style={{ background: '#0f172a', color: '#e2e8f0', maxHeight: '240px' }}
           dangerouslySetInnerHTML={{ __html: colourJson(json) }} />
      <style>{`.js{color:#86efac}.jn{color:#93c5fd}.jk{color:#f9a8d4}.jkey{color:#fde68a}`}</style>
    </div>
  )
}

function CommandLineBox({ cmdline }) {
  if (!cmdline) return <p className="text-xs text-slate-400 italic">No command line captured.</p>
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Command Line</span>
        <CopyButton text={cmdline} />
      </div>
      <div className="rounded-xl px-4 py-3 font-mono text-[12px] leading-relaxed break-all" style={{ background: '#0f172a', color: '#e2e8f0' }}>
        <HighlightedText text={cmdline} mono />
      </div>
    </div>
  )
}

const SEV_COLORS = {
  critical: '#dc2626', high: '#ea580c', medium: '#ca8a04', low: '#2563eb', info: '#64748b'
}

export default function EventDetailModal({ log, onClose }) {
  const overlayRef = useRef(null)
  const [activeTab, setActiveTab] = useState('details')
  const sev = getSeverity(log)
  const isAlert = sev === 'critical' || sev === 'high'

  const handleKey = useCallback(e => { if (e.key === 'Escape') onClose() }, [onClose])
  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = '' }
  }, [handleKey])

  const cmdLine   = log.command_line || log.commandline || log.CommandLine || log.cmd || null
  const procName  = log.process_name || log.ProcessName || log.Image || null
  const parentProc= log.parent_process || log.ParentProcess || log.ParentImage || null
  const user      = log.user || log.User || log.SubjectUserName || null
  const ip        = log.ip_address || log.ip || log.DestinationIp || log.SourceIp || null

  const TABS = [
    { id: 'details', label: 'Event Details' },
    { id: 'process', label: 'Process Info' },
    { id: 'raw',     label: 'Raw JSON' },
  ]

  return (
    <div ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose() }}
         className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>

      <div className="relative w-full bg-white flex flex-col overflow-hidden"
           style={{ maxWidth: '760px', maxHeight: '90vh', borderRadius: '20px', boxShadow: '0 25px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)' }}
           onClick={e => e.stopPropagation()}>

        {/* Severity top bar */}
        <div className="h-1 w-full flex-shrink-0 rounded-t-[20px]" style={{ background: SEV_COLORS[sev] || '#94a3b8' }} />

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                 style={{ background: isAlert ? '#fef2f2' : '#f8fafc', border: `1px solid ${isAlert ? '#fecaca' : '#e2e8f0'}` }}>
              <ShieldAlert size={18} style={{ color: isAlert ? '#dc2626' : '#94a3b8' }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-gray-900">{describeEventCode(log.event_code)}</h2>
                <SeverityBadge severity={sev} />
                {isAlert && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold"
                        style={{ fontSize: '10px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>
                    <AlertTriangle size={9} /> SUSPICIOUS
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1.5 flex-wrap" style={{ fontSize: '11px', color: '#94a3b8' }}>
                <span className="flex items-center gap-1"><Clock size={10} />{formatTimestamp(log.timestamp)}</span>
                <span className="flex items-center gap-1"><Monitor size={10} />{log.hostname || '—'}</span>
                <span className="flex items-center gap-1 font-mono"><Hash size={10} />EID {log.event_code || '—'}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose}
                  className="ml-3 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-all"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>
            <X size={15} />
          </button>
        </div>

        {/* ── Tabs + actions row ──────────────────────────────── */}
        <div className="flex items-center px-6 flex-shrink-0" style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
          <div className="flex items-center gap-0 flex-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                      className="px-4 py-3 text-xs font-semibold border-b-2 transition-colors"
                      style={{ borderColor: activeTab === t.id ? '#2563eb' : 'transparent', color: activeTab === t.id ? '#2563eb' : '#64748b' }}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="py-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <ActionButtons hostname={log.hostname} />
          </div>
        </div>

        {/* ── Scrollable body ─────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4 bg-white">

          {activeTab === 'details' && (
            <>
              <Section icon={isAlert ? AlertTriangle : FileText}
                       title={isAlert ? 'Suspicious Activity Detected' : 'Event Message'} accent={isAlert}>
                <p className="text-sm leading-relaxed break-all text-gray-700">
                  <HighlightedText text={log.message} />
                </p>
              </Section>
              <Section icon={Clock} title="Event Information">
                <Field label="Timestamp"  value={log.timestamp}             mono />
                <Field label="Hostname"   value={log.hostname} />
                <Field label="Event ID"   value={`${log.event_code} — ${describeEventCode(log.event_code)}`} mono />
                <Field label="Severity"   value={<SeverityBadge severity={sev} />} />
                <Field label="User"       value={user}  mono copyable />
                <Field label="IP Address" value={ip}    mono copyable />
              </Section>
              <Section icon={Terminal} title="Command Line" accent={!!cmdLine}>
                <CommandLineBox cmdline={cmdLine} />
              </Section>
            </>
          )}

          {activeTab === 'process' && (
            <>
              <Section icon={Terminal} title="Process Details">
                <Field label="Process Name"   value={procName}   mono highlight copyable />
                <Field label="Parent Process" value={parentProc} mono highlight copyable />
                <Field label="Command Line"   value={cmdLine}    mono highlight copyable />
                <Field label="User"           value={user}       mono copyable />
                <Field label="IP Address"     value={ip}         mono copyable />
              </Section>
              {cmdLine && (
                <Section icon={AlertTriangle} title="Command Line (Expanded)" accent>
                  <CommandLineBox cmdline={cmdLine} />
                </Section>
              )}
              <Section icon={FileText} title="Full Message">
                <p className="text-xs font-mono leading-relaxed break-all text-slate-700">
                  <HighlightedText text={log.message} mono />
                </p>
              </Section>
            </>
          )}

          {activeTab === 'raw' && (
            <Section icon={Hash} title="Raw Event JSON">
              <JsonViewer data={log} />
            </Section>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3 flex-shrink-0"
             style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
          <span className="font-mono text-slate-400" style={{ fontSize: '10px' }}>
            ID: {log.id ?? '—'} · {log.hostname ?? '—'} · {formatTimestamp(log.timestamp)}
          </span>
          <button onClick={onClose}
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl transition-all"
                  style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
