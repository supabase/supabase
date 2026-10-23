import { describe, expect, it } from 'vitest'

import { generateIssuesMenu } from './IssuesMenu.utils'

describe('generateIssuesMenu', () => {
  it('links each category shortcut to the filtered issues list', () => {
    const [issues] = generateIssuesMenu({
      ref: 'abc',
      isAdvisorRulesEnabled: false,
      isPlatform: true,
    })

    expect(issues.items.map((item) => item.key)).toEqual([
      'security',
      'performance',
      'health',
      'query-performance',
    ])
    expect(issues.items[0].url).toBe('/project/abc/issues?category=security')
  })

  it('adds check settings only on platform with advisor rules enabled', () => {
    expect(
      generateIssuesMenu({ ref: 'abc', isAdvisorRulesEnabled: true, isPlatform: true })
    ).toHaveLength(2)
    expect(
      generateIssuesMenu({ ref: 'abc', isAdvisorRulesEnabled: true, isPlatform: false })
    ).toHaveLength(1)
  })
})
