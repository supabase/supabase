import { describe, expect, it } from 'vitest'

import { resolveBreadcrumbs } from './breadcrumbs'

describe('resolveBreadcrumbs', () => {
  it('places troubleshooting under detect and resolve', () => {
    expect(resolveBreadcrumbs('/guides/troubleshooting')).toEqual([
      {
        name: 'Monitoring and Debugging',
        url: '/guides/monitoring-and-debugging',
      },
      { name: 'Detect and resolve issues' },
      { name: 'Diagnosing', url: '/guides/troubleshooting' },
    ])
  })
})
