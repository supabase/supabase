import { describe, expect, it } from 'vitest'

import { generateAdvisorsMenu } from './AdvisorsMenu.utils'

describe('generateAdvisorsMenu', () => {
  it('puts Health Advisor first on platform', () => {
    const [advisors] = generateAdvisorsMenu({
      ref: 'abc',
      isAdvisorRulesEnabled: false,
      isHealthAdvisorEnabled: true,
      isPlatform: true,
    })

    expect(advisors.items.map((item) => item.key)).toEqual([
      'health',
      'security',
      'performance',
      'query-performance',
    ])
    expect(advisors.items[0].url).toBe('/project/abc/advisors/health')
  })

  it('omits Health Advisor when not on platform', () => {
    const [advisors] = generateAdvisorsMenu({
      ref: 'abc',
      isAdvisorRulesEnabled: false,
      isHealthAdvisorEnabled: false,
      isPlatform: false,
    })

    expect(advisors.items.map((item) => item.key)).toEqual([
      'security',
      'performance',
      'query-performance',
    ])
  })

  it('omits Health Advisor when the flag is disabled', () => {
    const [advisors] = generateAdvisorsMenu({
      ref: 'abc',
      isAdvisorRulesEnabled: false,
      isHealthAdvisorEnabled: false,
      isPlatform: true,
    })

    expect(advisors.items.map((item) => item.key)).toEqual([
      'security',
      'performance',
      'query-performance',
    ])
  })
})
