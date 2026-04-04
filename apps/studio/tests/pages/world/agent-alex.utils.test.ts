import { describe, test, expect } from 'vitest'
import {
  getToolOutput,
  shouldCreateMission,
  createMissionFromCommand,
} from 'pages/world/agent-alex.utils'

// ─── getToolOutput ────────────────────────────────────────
describe('getToolOutput', () => {
  test('returns array for codeBreaker', () => {
    const output = getToolOutput('codeBreaker')
    expect(Array.isArray(output)).toBe(true)
    expect(output.length).toBeGreaterThan(0)
  })

  test('returns array for networkScan', () => {
    const output = getToolOutput('networkScan')
    expect(output.length).toBeGreaterThan(0)
    expect(output.some((line) => line.includes('Scanning'))).toBe(true)
  })

  test('returns array for dataExtract', () => {
    const output = getToolOutput('dataExtract')
    expect(output.length).toBeGreaterThan(0)
  })

  test('returns array for encryptMsg', () => {
    const output = getToolOutput('encryptMsg')
    expect(output.length).toBeGreaterThan(0)
    expect(output.some((line) => line.includes('Encryption'))).toBe(true)
  })

  test('returns default for unknown tool', () => {
    const output = getToolOutput('unknownTool')
    expect(output).toEqual(['Running...', 'Complete.'])
  })

  test('returns default for empty string', () => {
    const output = getToolOutput('')
    expect(output).toEqual(['Running...', 'Complete.'])
  })
})

// ─── shouldCreateMission ──────────────────────────────────
describe('shouldCreateMission', () => {
  test('returns true when command contains "mission"', () => {
    expect(shouldCreateMission('Start new mission Alpha')).toBe(true)
  })

  test('is case-insensitive', () => {
    expect(shouldCreateMission('MISSION BRAVO')).toBe(true)
    expect(shouldCreateMission('Mission Charlie')).toBe(true)
  })

  test('returns false when command does not contain "mission"', () => {
    expect(shouldCreateMission('scan network')).toBe(false)
    expect(shouldCreateMission('encrypt data')).toBe(false)
  })

  test('returns false for empty command', () => {
    expect(shouldCreateMission('')).toBe(false)
  })
})

// ─── createMissionFromCommand ─────────────────────────────
describe('createMissionFromCommand', () => {
  test('creates a mission with correct title', () => {
    const mission = createMissionFromCommand('Infiltrer base Delta', 42)
    expect(mission.title).toBe('Infiltrer base Delta')
  })

  test('creates a mission with active status', () => {
    const mission = createMissionFromCommand('test', 1)
    expect(mission.status).toBe('active')
  })

  test('creates a mission with high priority', () => {
    const mission = createMissionFromCommand('test', 1)
    expect(mission.priority).toBe('high')
  })

  test('uses provided id', () => {
    const mission = createMissionFromCommand('test', 999)
    expect(mission.id).toBe(999)
  })

  test('generates id from Date.now when not provided', () => {
    const before = Date.now()
    const mission = createMissionFromCommand('test')
    expect(mission.id).toBeGreaterThanOrEqual(before)
  })

  test('timestamp is a Date object', () => {
    const mission = createMissionFromCommand('test', 1)
    expect(mission.timestamp).toBeInstanceOf(Date)
  })
})
