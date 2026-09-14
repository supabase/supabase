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

  it.each([
    { isPlatform: false, isHealthAdvisorEnabled: true },
    { isPlatform: true, isHealthAdvisorEnabled: false },
    { isPlatform: false, isHealthAdvisorEnabled: false },
  ])('omits Health Advisor with %o', ({ isPlatform, isHealthAdvisorEnabled }) => {
    const [advisors] = generateAdvisorsMenu({
      ref: 'abc',
      isAdvisorRulesEnabled: false,
      isHealthAdvisorEnabled,
      isPlatform,
    })

    expect(advisors.items.map((item) => item.key)).toEqual([
      'security',
      'performance',
      'query-performance',
    ])
  })
})
