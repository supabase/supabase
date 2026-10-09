import { describe, expect, it } from 'vitest'

import { isIsolatedStudioFlow } from './useHideSidebar'

describe('isIsolatedStudioFlow', () => {
  it('matches the pipeline create page', () => {
    expect(isIsolatedStudioFlow('/project/abcdefgh/database/pipelines/new')).toBe(true)
    expect(isIsolatedStudioFlow('/project/abcdefgh/database/pipelines/new/')).toBe(true)
    expect(
      isIsolatedStudioFlow('/project/abcdefgh/database/pipelines/new?destinationType=BigQuery')
    ).toBe(true)
  })

  it('does not match other replication pages', () => {
    expect(isIsolatedStudioFlow('/project/abcdefgh/database/pipelines')).toBe(false)
    expect(isIsolatedStudioFlow('/project/abcdefgh/database/pipelines/42')).toBe(false)
    expect(isIsolatedStudioFlow('/new/abcdefgh')).toBe(false)
  })
})
