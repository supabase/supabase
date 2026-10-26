import { describe, expect, it } from 'vitest'

import { generateAdvisorsMenu } from './AdvisorsMenu.utils'

describe('generateAdvisorsMenu', () => {
  it('puts Health Advisor first when enabled', () => {
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

  it('omits Health Advisor when disabled', () => {
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
