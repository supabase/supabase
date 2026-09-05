import { describe, expect, it } from 'vitest'

import { AgentWatchSchedule } from './AgentWatchSchedule'

describe('AgentWatchSchedule markdown schema', () => {
  it('serializes the scheduled and on-demand copy', () => {
    const markdown = AgentWatchSchedule({ props: { id: 'health' } })

    expect(markdown).toContain('Run it once per hour on a schedule.')
    expect(markdown).toContain('Run it on demand after a deployment')
  })

  it('fails clearly for an unknown agent', () => {
    expect(() => AgentWatchSchedule({ props: { id: 'missing' } })).toThrow(
      'Unknown monitoring agent id: missing'
    )
  })
})
