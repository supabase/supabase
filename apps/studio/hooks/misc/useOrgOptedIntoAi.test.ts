import { describe, expect, it } from 'vitest'

import { getAiRepoAccess } from './useOrgOptedIntoAi'

describe('getAiRepoAccess', () => {
  it('requires the independent repository opt-in tag', () => {
    expect(getAiRepoAccess(['AI_SQL_GENERATOR_OPT_IN'])).toBe(false)
    expect(getAiRepoAccess(['AI_SQL_GENERATOR_OPT_IN', 'AI_REPO_ACCESS_OPT_IN'])).toBe(true)
  })
})
