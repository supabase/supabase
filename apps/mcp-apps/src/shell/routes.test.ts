import { describe, expect, it } from 'vitest'

import { parseRoute } from './routes'

describe('parseRoute', () => {
  it('opens a project table from a mention link', () => {
    expect(parseRoute('/projects/abc?schema=public&table=todos')).toEqual({
      projectId: 'abc',
      schema: 'public',
      table: 'todos',
    })
  })

  it('ignores links that could point outside the app', () => {
    // Deep links come from the host; only the project route shape is honored.
    expect(parseRoute('//evil.example/projects/abc')).toBeNull()
    expect(parseRoute('/settings')).toBeNull()
    expect(parseRoute('projects/abc')).toBeNull()
  })
})
