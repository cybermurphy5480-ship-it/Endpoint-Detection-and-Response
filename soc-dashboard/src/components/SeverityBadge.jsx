import React from 'react'

const config = {
  critical: { label: 'Critical', className: 'badge-critical' },
  high:     { label: 'High',     className: 'badge-high' },
  medium:   { label: 'Medium',   className: 'badge-medium' },
  low:      { label: 'Low',      className: 'badge-low' },
  info:     { label: 'Info',     className: 'badge-info' },
}

export default function SeverityBadge({ severity }) {
  const c = config[severity] || config['info']
  return <span className={c.className}>{c.label}</span>
}
