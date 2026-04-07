// ─── AGENT ALEX UTILITIES ─────────────────────────────────
// Pure functions extracted from agent-alex.tsx for testability

export interface MissionEntry {
  id: number
  title: string
  status: 'active' | 'completed' | 'failed'
  priority: 'high' | 'medium' | 'low'
  timestamp: Date
}

const TOOL_OUTPUTS: Record<string, string[]> = {
  codeBreaker: [
    'Decrypting...',
    'Key found: 0xMARCEAU_ALEX_2024',
    'Cipher: AES-512-OMEGA',
    'Decrypted payload: [CLASSIFIED]',
    'Status: SUCCESS',
  ],
  networkScan: [
    'Scanning ports 1-65535...',
    'Host 192.168.1.1: OPEN [22,80,443]',
    'Host 10.0.0.1: OPEN [8080,3306]',
    'Host 172.16.0.1: FILTERED',
    'Vulnerabilities found: 0',
    'Network: SECURE',
  ],
  dataExtract: [
    'Connecting to target database...',
    'Authentication: BYPASSED',
    'Tables found: 147',
    'Extracting records...',
    '████████████████ 100%',
    'Data saved to /vault/extract_001.enc',
  ],
  encryptMsg: [
    'Encryption mode: MARCEAU-OMEGA',
    'Generating key pair...',
    'RSA-4096 + AES-512',
    'Message encrypted successfully',
    'Signature: AGENT_ALEX_VERIFIED',
    'Expiry: 24h auto-destruct',
  ],
}

/**
 * Get the output lines for a given tool
 * Returns a default if tool is unknown
 */
export function getToolOutput(toolName: string): string[] {
  return TOOL_OUTPUTS[toolName] || ['Running...', 'Complete.']
}

/**
 * Determine if a command should create a new mission
 */
export function shouldCreateMission(command: string): boolean {
  return command.toLowerCase().includes('mission')
}

/**
 * Create a MissionEntry from a user command
 */
export function createMissionFromCommand(command: string, id?: number): MissionEntry {
  return {
    id: id ?? Date.now(),
    title: command,
    status: 'active',
    priority: 'high',
    timestamp: new Date(),
  }
}
