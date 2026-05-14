import React from 'react'
import { ShieldCheck, RefreshCw, Monitor, Activity, Wifi } from 'lucide-react'

export default function Navbar({ endpointCount, lastRefresh, refreshing, onRefreshNow }) {
  return (
    <header className="bg-white sticky top-0 z-50" style={{ borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center gap-4">

        {/* Brand */}
        <div className="flex items-center gap-2.5 mr-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', boxShadow: '0 2px 8px rgba(220,38,38,0.3)' }}>
            <ShieldCheck size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-none">SOC Dashboard</p>
            <p className="text-slate-400 text-[10px] mt-0.5 font-medium tracking-wide">INCIDENT RESPONSE & THREAT MONITORING</p>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-200" />

        {/* Live pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
          <span className="text-green-700 font-bold text-[10px] tracking-widest">LIVE</span>
        </div>

        {/* Endpoints */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <Monitor size={11} className="text-blue-500" />
          <span className="text-blue-700 font-bold text-[10px]">{endpointCount} ENDPOINTS</span>
        </div>

        {/* Activity */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}>
          <Activity size={11} className="text-purple-500" />
          <span className="text-purple-700 font-bold text-[10px]">MONITORING</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {lastRefresh && (
            <span className="text-slate-400 hidden lg:block font-mono text-[10px]">
              Updated {lastRefresh}
            </span>
          )}
          <button
            onClick={onRefreshNow}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569' }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>
    </header>
  )
}
