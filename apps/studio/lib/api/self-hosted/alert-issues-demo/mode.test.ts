import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadMode(env: Record<string, string>) {
  vi.resetModules()
  Object.entries(env).forEach(([key, value]) => vi.stubEnv(key, value))
  return import('./mode')
}

describe('alert issues demo mode', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('is on for self-hosted development with ALERT_ISSUES_DEMO=mock', async () => {
    const { isAlertIssuesDemoMode } = await loadMode({ ALERT_ISSUES_DEMO: 'mock' })
    expect(isAlertIssuesDemoMode()).toBe(true)
  })

  it('is off without the flag', async () => {
    const { isAlertIssuesDemoMode } = await loadMode({ ALERT_ISSUES_DEMO: '' })
    expect(isAlertIssuesDemoMode()).toBe(false)
  })

  it('is never on for the platform', async () => {
    const { isAlertIssuesDemoMode } = await loadMode({
      ALERT_ISSUES_DEMO: 'mock',
      NEXT_PUBLIC_IS_PLATFORM: 'true',
    })
    expect(isAlertIssuesDemoMode()).toBe(false)
  })

  it('is never on in production builds', async () => {
    const { isAlertIssuesDemoMode } = await loadMode({
      ALERT_ISSUES_DEMO: 'mock',
      NODE_ENV: 'production',
    })
    expect(isAlertIssuesDemoMode()).toBe(false)
  })

  it('shortens every delay with ALERT_ISSUES_DEMO_SPEED=fast', async () => {
    const normal = (await loadMode({ ALERT_ISSUES_DEMO_SPEED: '' })).getDemoDelays()
    const fast = (await loadMode({ ALERT_ISSUES_DEMO_SPEED: 'fast' })).getDemoDelays()

    expect(normal).toEqual({ arrivalMs: 30_000, investigationMs: 20_000, customRuleMs: 60_000 })
    expect(fast.arrivalMs).toBeLessThan(normal.arrivalMs)
    expect(fast.investigationMs).toBeLessThan(normal.investigationMs)
    expect(fast.customRuleMs).toBeLessThan(normal.customRuleMs)
  })
})
