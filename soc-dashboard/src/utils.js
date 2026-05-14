// Suspicious patterns to highlight
const SUSPICIOUS_PATTERNS = [
  /powershell/i,
  /\-enc\b/i,
  /\-encodedcommand/i,
  /cmd\.exe/i,
  /mimikatz/i,
  /whoami/i,
  /net\s+user/i,
  /net\s+localgroup/i,
  /wscript/i,
  /mshta/i,
  /regsvr32/i,
  /certutil/i,
  /bitsadmin/i,
  /rundll32/i,
  /bypass/i,
  /invoke-expression/i,
  /iex\s*\(/i,
  /downloadstring/i,
]

export function isSuspicious(message = '') {
  return SUSPICIOUS_PATTERNS.some((p) => p.test(message))
}

// Determine severity from event_code and message
export function getSeverity(event) {
  const code = String(event.event_code || '')
  const msg = String(event.message || '')

  if (isSuspicious(msg)) return 'critical'

  const criticalCodes = ['4625', '4648', '4719', '4964', '1102', '4720', '4728', '4732', '4756']
  const highCodes = ['4688', '4697', '7045', '4698', '4702', '4704', '4705']
  const mediumCodes = ['4624', '4634', '4647', '4663', '4657']

  if (criticalCodes.includes(code)) return 'critical'
  if (highCodes.includes(code)) return 'high'
  if (mediumCodes.includes(code)) return 'medium'
  return 'low'
}

export function formatTimestamp(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  if (isNaN(d)) return ts
  return d.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function timeAgo(ts) {
  if (!ts) return 'Never'
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// Well-known Sysmon/Windows event code descriptions
const EVENT_DESCRIPTIONS = {
  '1':    'Process Create',
  '2':    'File Creation Time Changed',
  '3':    'Network Connection',
  '5':    'Process Terminated',
  '7':    'Image Loaded',
  '8':    'CreateRemoteThread',
  '10':   'ProcessAccess',
  '11':   'FileCreate',
  '12':   'RegistryEvent (Create/Delete)',
  '13':   'RegistryEvent (Set Value)',
  '15':   'FileCreateStreamHash',
  '22':   'DNS Query',
  '4624': 'Logon Success',
  '4625': 'Logon Failure',
  '4648': 'Explicit Credential Logon',
  '4688': 'Process Creation',
  '4697': 'Service Installed',
  '4719': 'Audit Policy Changed',
  '4720': 'User Account Created',
  '7045': 'New Service',
  '1102': 'Audit Log Cleared',
}

export function describeEventCode(code) {
  return EVENT_DESCRIPTIONS[String(code)] || `Event ${code}`
}
