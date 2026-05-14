import React from 'react'
import { AlertCircle, X } from 'lucide-react'

export default function ErrorBanner({ message, onDismiss }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
         style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
      <AlertCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
      <p className="text-xs font-medium flex-1" style={{ color: '#991b1b' }}>{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="flex-shrink-0 rounded-lg p-0.5 transition-all"
                style={{ color: '#dc2626' }}>
          <X size={13} />
        </button>
      )}
    </div>
  )
}
