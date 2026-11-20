import { describe, expect, it } from 'vitest'

import { generateIssuesMenu } from './IssuesMenu.utils'

const defaults = {
  ref: 'abc',
  isAdvisorRulesEnabled: false,
  isHealthAdvisorEnabled: false,
  isPlatform: true,
}

describe('generateIssuesMenu', () => {
  it('opens each category shortcut on the filtered issues list', () => {
    const [issues] = generateIssuesMenu(defaults)

    expect(issues.items.map((item) => item.url)).toEqual([
      '/project/abc/issues?category=security',
      '/project/abc/issues?category=performance',
    ])
  })

  it('only offers the health shortcut to projects with health checks', () => {
    const [issues] = generateIssuesMenu({ ...defaults, isHealthAdvisorEnabled: true })

    expect(issues.items.map((item) => item.key)).toContain('health')
  })

  it('only offers check settings on platform with advisor rules enabled', () => {
    expect(generateIssuesMenu({ ...defaults, isAdvisorRulesEnabled: true })).toHaveLength(2)
    expect(
      generateIssuesMenu({ ...defaults, isAdvisorRulesEnabled: true, isPlatform: false })
    ).toHaveLength(1)
  })
})
