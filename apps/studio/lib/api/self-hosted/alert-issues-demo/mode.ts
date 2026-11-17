import { IS_PLATFORM } from '@/lib/constants'

/**
 * Mock mode serves the self-hosted alert issue routes from an in-memory simulation of Logflare
 * and the o11y-sre-agent investigator, so the whole feature can be tried without either.
 * It is only for local self-hosted development: never on the platform or in production builds.
 */
export function isAlertIssuesDemoMode() {
  return (
    !IS_PLATFORM &&
    process.env.NODE_ENV !== 'production' &&
    process.env.ALERT_ISSUES_DEMO === 'mock'
  )
}

export type DemoDelays = {
  /** Until the scheduled alert issue arrives (pending its initial investigation). */
  arrivalMs: number
  /** How long an initial investigation runs before its report is posted. */
  investigationMs: number
  /** Until a new custom log rule's first scheduled run. */
  customRuleMs: number
}

/** `ALERT_ISSUES_DEMO_SPEED=fast` shortens every delay, for tests and recordings. */
export function getDemoDelays(): DemoDelays {
  return process.env.ALERT_ISSUES_DEMO_SPEED === 'fast'
    ? { arrivalMs: 3_000, investigationMs: 2_000, customRuleMs: 5_000 }
    : { arrivalMs: 30_000, investigationMs: 20_000, customRuleMs: 60_000 }
}
