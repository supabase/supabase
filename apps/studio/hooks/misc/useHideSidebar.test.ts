import { describe, expect, it } from 'vitest'

import { isIsolatedStudioFlow } from './useHideSidebar'

describe('isIsolatedStudioFlow', () => {
  it('matches the pipeline create page', () => {
    expect(isIsolatedStudioFlow('/project/abcdefgh/database/replication/new')).toBe(true)
    expect(isIsolatedStudioFlow('/project/abcdefgh/database/replication/new/')).toBe(true)
    expect(
      isIsolatedStudioFlow('/project/abcdefgh/database/replication/new?destinationType=BigQuery')
    ).toBe(true)
  })

  it('does not match other replication pages', () => {
    expect(isIsolatedStudioFlow('/project/abcdefgh/database/replication')).toBe(false)
    expect(isIsolatedStudioFlow('/project/abcdefgh/database/replication/42')).toBe(false)
    expect(isIsolatedStudioFlow('/new/abcdefgh')).toBe(false)
  })
})
