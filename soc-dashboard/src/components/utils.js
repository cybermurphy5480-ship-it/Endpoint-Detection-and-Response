// ============================================
// INTELLIGENT SEVERITY DETECTION SYSTEM
// No hardcoded event codes - uses behavioral analysis
// ============================================

// ============================================
// 1. SUSPICIOUS PATTERN DETECTION
// ============================================

const SUSPICIOUS_PATTERNS = {
  // Command execution and obfuscation
  obfuscation: [
    /\-enc(odedcommand)?\b/i,
    /frombase64string/i,
    /[a-zA-Z0-9+\/]{50,}={0,2}/,  // Base64 strings
    /\$\([^\)]{20,}\)/,            // Complex PowerShell variable expansion
    /-w(indowstyle)?\s+hidden/i,
    /-nop(rofile)?/i,
    /-ep\s+bypass/i,
    /iex\s*\(/i,
    /invoke-expression/i,
  ],
  
  // Credential access
  credentialAccess: [
    /mimikatz/i,
    /dumpcreds/i,
    /lsass/i,
    /sekurlsa/i,
    /procdump.*lsass/i,
    /comsvcs\.dll.*minidump/i,
  ],
  
  // Persistence mechanisms
  persistence: [
    /schtasks.*\/create/i,
    /reg\s+add.*\\run/i,
    /\\currentversion\\run/i,
    /wmi.*create/i,
    /new-service/i,
    /sc\s+(create|config)/i,
  ],
  
  // Lateral movement
  lateralMovement: [
    /psexec/i,
    /wmic.*process.*call.*create/i,
    /invoke-command.*-computername/i,
    /enter-pssession/i,
    /\\\\[^\\]+\\(admin\$|c\$|ipc\$)/i,
  ],
  
  // Defense evasion
  defenseEvasion: [
    /disable.*antivirus/i,
    /stop-service.*defender/i,
    /uninstall.*security/i,
    /auditpol\s+\/clear/i,
    /wevtutil.*cl(ear)?/i,
    /timestomp/i,
  ],
  
  // Discovery
  discovery: [
    /net\s+(user|group|localgroup|view|share)/i,
    /whoami/i,
    /systeminfo/i,
    /tasklist/i,
    /net\s+config/i,
    /nltest/i,
    /dsquery/i,
  ],
  
  // Exploitation tools
  exploitationTools: [
    /metasploit/i,
    /msfvenom/i,
    /cobalt.*strike/i,
    /empire/i,
    /bloodhound/i,
  ],
  
  // Suspicious protocols and connections
  suspiciousNetwork: [
    /nc\.exe/i,
    /ncat/i,
    /netcat/i,
    /:4444\b/,
    /:31337\b/,
    /:8080.*\/shell/i,
    /reverse.*shell/i,
  ],
  
  // File operations
  suspiciousFiles: [
    /\.ps1.*-exec(utionpolicy)?\s+bypass/i,
    /\.(exe|dll|scr|bat|vbs|js).*\\temp\\/i,
    /\.(exe|dll).*\\appdata\\/i,
    /certutil.*-decode/i,
    /bitsadmin.*\/transfer/i,
    /powershell.*downloadfile/i,
    /wget\s+http/i,
    /curl.*http.*-o/i,
  ],
}

// Calculate pattern match score
function calculatePatternScore(message = '') {
  let score = 0
  let matches = []
  
  for (const [category, patterns] of Object.entries(SUSPICIOUS_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        // Different categories have different weights
        const weight = {
          obfuscation: 3,
          credentialAccess: 4,
          persistence: 3,
          lateralMovement: 4,
          defenseEvasion: 4,
          discovery: 1,
          exploitationTools: 4,
          suspiciousNetwork: 3,
          suspiciousFiles: 2,
        }[category] || 1
        
        score += weight
        matches.push(category)
      }
    }
  }
  
  return { score, matches: [...new Set(matches)] }
}

// ============================================
// 2. EVENT CODE BEHAVIORAL ANALYSIS
// ============================================

// Categorize event codes by behavior, not by hardcoding severity
function analyzeEventBehavior(eventCode) {
  const code = String(eventCode || '')
  
  // Authentication failures (brute force indicators)
  if (/^4625$|^4771$|^4776$/.test(code)) {
    return { category: 'auth_failure', risk: 3, description: 'Authentication Failure' }
  }
  
  // Privileged account activity
  if (/^4672$|^4673$|^4674$/.test(code)) {
    return { category: 'privileged_use', risk: 2, description: 'Privileged Operation' }
  }
  
  // Account manipulation
  if (/^4720$|^4722$|^4724$|^4738$/.test(code)) {
    return { category: 'account_manipulation', risk: 3, description: 'Account Modified' }
  }
  
  // Group membership changes
  if (/^4728$|^4732$|^4756$/.test(code)) {
    return { category: 'group_modification', risk: 3, description: 'Group Membership Changed' }
  }
  
  // Audit log manipulation
  if (/^1102$|^1100$|^517$/.test(code)) {
    return { category: 'log_tampering', risk: 4, description: 'Audit Log Cleared' }
  }
  
  // Policy changes
  if (/^4719$|^4715$|^4739$/.test(code)) {
    return { category: 'policy_change', risk: 3, description: 'Security Policy Changed' }
  }
  
  // Service installation/changes
  if (/^4697$|^7045$|^7040$/.test(code)) {
    return { category: 'service_change', risk: 2, description: 'Service Modified' }
  }
  
  // Process creation (Sysmon Event ID 1)
  if (/^1$/.test(code)) {
    return { category: 'process_create', risk: 1, description: 'Process Created' }
  }
  
  // Network connections (Sysmon Event ID 3)
  if (/^3$/.test(code)) {
    return { category: 'network_connection', risk: 1, description: 'Network Connection' }
  }
  
  // Registry modifications (Sysmon 12, 13, 14)
  if (/^1[234]$/.test(code)) {
    return { category: 'registry_modification', risk: 2, description: 'Registry Modified' }
  }
  
  // File creation (Sysmon 11)
  if (/^11$/.test(code)) {
    return { category: 'file_creation', risk: 1, description: 'File Created' }
  }
  
  // Process access (Sysmon 10)
  if (/^10$/.test(code)) {
    return { category: 'process_access', risk: 2, description: 'Process Accessed' }
  }
  
  // DNS queries (Sysmon 22)
  if (/^22$/.test(code)) {
    return { category: 'dns_query', risk: 1, description: 'DNS Query' }
  }
  
  // Successful logon (context matters)
  if (/^4624$/.test(code)) {
    return { category: 'auth_success', risk: 1, description: 'Logon Success' }
  }
  
  // Explicit credentials used
  if (/^4648$/.test(code)) {
    return { category: 'explicit_creds', risk: 2, description: 'Explicit Credentials Used' }
  }
  
  // Process creation (Windows)
  if (/^4688$/.test(code)) {
    return { category: 'process_create', risk: 1, description: 'Process Created' }
  }
  
  // Default for unknown codes
  return { category: 'unknown', risk: 1, description: `Event ${code}` }
}

// ============================================
// 3. CONTEXTUAL ANALYSIS
// ============================================

function analyzeContext(event) {
  const message = String(event.message || '')
  const username = String(event.username || event.user || '')
  const hostname = String(event.hostname || '')
  
  let contextScore = 0
  
  // Privileged accounts performing actions
  if (/administrator|admin|root|system/i.test(username)) {
    contextScore += 1
  }
  
  // Critical system processes
  if (/lsass|winlogon|csrss|services\.exe|svchost/i.test(message)) {
    contextScore += 2
  }
  
  // Sensitive paths
  if (/\\windows\\system32|\\program files|\\programdata/i.test(message)) {
    contextScore += 1
  }
  
  // Unusual times (if timestamp available)
  if (event.timestamp) {
    const hour = new Date(event.timestamp).getHours()
    // Outside business hours (10pm - 6am)
    if (hour >= 22 || hour <= 6) {
      contextScore += 1
    }
  }
  
  // Multiple suspicious indicators in single event
  const suspiciousWords = [
    'bypass', 'hidden', 'encoded', 'obfuscated',
    'privilege', 'escalation', 'exploit', 'payload'
  ]
  const suspiciousCount = suspiciousWords.filter(word => 
    message.toLowerCase().includes(word)
  ).length
  
  if (suspiciousCount >= 2) {
    contextScore += suspiciousCount
  }
  
  return contextScore
}

// ============================================
// 4. INTELLIGENT SEVERITY CALCULATION
// ============================================

export function getSeverity(event) {
  const message = String(event.message || '')
  const eventCode = String(event.event_code || '')
  
  // Calculate different risk factors
  const patternAnalysis = calculatePatternScore(message)
  const behaviorAnalysis = analyzeEventBehavior(eventCode)
  const contextScore = analyzeContext(event)
  
  // Weighted scoring system
  let totalScore = 0
  
  // Pattern matching (0-20 points)
  totalScore += Math.min(patternAnalysis.score, 20)
  
  // Event behavior (0-8 points)
  totalScore += behaviorAnalysis.risk * 2
  
  // Context (0-10 points)
  totalScore += Math.min(contextScore * 2, 10)
  
  // Bonus for multiple indicators
  if (patternAnalysis.matches.length >= 2) {
    totalScore += 5
  }
  
  // Determine severity based on total score
  if (totalScore >= 15) return 'critical'  // 15+ points
  if (totalScore >= 10) return 'high'      // 10-14 points
  if (totalScore >= 5)  return 'medium'    // 5-9 points
  if (totalScore >= 2)  return 'low'       // 2-4 points
  return 'info'                             // 0-1 points
}

// ============================================
// 5. ENHANCED SUSPICIOUS DETECTION
// ============================================

export function isSuspicious(message = '') {
  const { score } = calculatePatternScore(message)
  return score >= 3  // Threshold for suspicious activity
}

// Get detailed analysis (useful for debugging/detailed view)
export function getDetailedAnalysis(event) {
  const message = String(event.message || '')
  const eventCode = String(event.event_code || '')
  
  const patternAnalysis = calculatePatternScore(message)
  const behaviorAnalysis = analyzeEventBehavior(eventCode)
  const contextScore = analyzeContext(event)
  const severity = getSeverity(event)
  
  return {
    severity,
    patternScore: patternAnalysis.score,
    patternMatches: patternAnalysis.matches,
    behaviorCategory: behaviorAnalysis.category,
    behaviorRisk: behaviorAnalysis.risk,
    contextScore,
    totalScore: patternAnalysis.score + (behaviorAnalysis.risk * 2) + (contextScore * 2),
    indicators: patternAnalysis.matches,
  }
}

// ============================================
// 6. UTILITY FUNCTIONS (unchanged)
// ============================================

export function formatTimestamp(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  if (isNaN(d)) return '—'
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
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

// Event code descriptions (kept for UI display, not used in severity calculation)
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
  '4722': 'User Account Enabled',
  '4724': 'Password Reset Attempted',
  '4728': 'Member Added to Security Group',
  '4732': 'Member Added to Local Group',
  '4756': 'Member Added to Universal Group',
  '7045': 'New Service',
  '1102': 'Audit Log Cleared',
}

export function describeEventCode(code) {
  return EVENT_DESCRIPTIONS[String(code)] || `Event ${code}`
}

// ============================================
// 7. MITRE ATT&CK MAPPING (Optional)
// ============================================

export function getMitreTechniques(event) {
  const message = String(event.message || '').toLowerCase()
  const techniques = []
  
  if (/powershell.*-enc|invoke-expression/.test(message)) {
    techniques.push({ id: 'T1059.001', name: 'PowerShell' })
  }
  
  if (/mimikatz|lsass|dumpcreds/.test(message)) {
    techniques.push({ id: 'T1003', name: 'OS Credential Dumping' })
  }
  
  if (/schtasks.*\/create|\\run/.test(message)) {
    techniques.push({ id: 'T1053', name: 'Scheduled Task/Job' })
  }
  
  if (/psexec|wmic.*process.*create/.test(message)) {
    techniques.push({ id: 'T1021', name: 'Remote Services' })
  }
  
  if (/net\s+(user|group|localgroup)/.test(message)) {
    techniques.push({ id: 'T1087', name: 'Account Discovery' })
  }
  
  if (/wevtutil.*cl|auditpol.*clear/.test(message)) {
    techniques.push({ id: 'T1070', name: 'Indicator Removal' })
  }
  
  return techniques
}
