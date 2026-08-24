import { describe, expect, it } from 'vitest'

import { monitoringAgents } from './monitoring-agents.data'
import {
  getCronExpression,
  getMonitoringAgent,
  getMonitoringAgentHarnesses,
  getScheduleMarks,
} from './monitoring-agents.utils'

describe('getMonitoringAgent', () => {
  it('returns a registered agent', () => {
    expect(getMonitoringAgent('health').name).toBe('Doctor')
  })

  it('fails clearly for an unknown id', () => {
    expect(() => getMonitoringAgent('missing')).toThrow('Unknown monitoring agent id: missing')
  })
})

describe('getScheduleMarks', () => {
  it('renders a 24-hour day for 15-minute cadence', () => {
    const { window, marks } = getScheduleMarks(15)
    expect(window).toBe('day')
    expect(marks).toHaveLength(96)
    expect(marks.filter((mark) => mark.label).map((mark) => mark.label)).toEqual([
      '12am',
      '6am',
      '12pm',
      '6pm',
    ])
  })

  it('renders a 24-hour day for hourly cadence', () => {
    const { window, marks } = getScheduleMarks(60)
    expect(window).toBe('day')
    expect(marks).toHaveLength(24)
    expect(marks[0].label).toBe('12am')
    expect(marks[12].label).toBe('12pm')
  })

  it('renders a week for daily cadence', () => {
    const { window, marks } = getScheduleMarks(1440)
    expect(window).toBe('week')
    expect(marks.map((mark) => mark.label)).toEqual([
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ])
  })
})

describe('getCronExpression', () => {
  it('maps supported intervals', () => {
    expect(getCronExpression(15)).toBe('*/15 * * * *')
    expect(getCronExpression(60)).toBe('0 * * * *')
    expect(getCronExpression(1440)).toBe('0 9 * * *')
  })
})

describe('getMonitoringAgentHarnesses', () => {
  it('includes a Desktop-task note for sub-hourly Claude routines', () => {
    const claude = getMonitoringAgentHarnesses(monitoringAgents.health).find(
      (harness) => harness.key === 'claude'
    )

    expect(claude?.intro).toContain('Desktop scheduled task')
    expect(claude?.note).toContain('1-hour minimum')
  })

  it('omits the Desktop-task note when the cadence is hourly or slower', () => {
    const claude = getMonitoringAgentHarnesses(monitoringAgents.performance).find(
      (harness) => harness.key === 'claude'
    )

    expect(claude?.intro).toContain('Create a Claude routine')
    expect(claude?.note).toBeUndefined()
  })
})
