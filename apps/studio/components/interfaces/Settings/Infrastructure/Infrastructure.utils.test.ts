import { describe, expect, it } from 'vitest'

import { getInfrastructurePath } from './Infrastructure.utils'

describe('getInfrastructurePath', () => {
  it('builds the path for a project ref', () => {
    expect(getInfrastructurePath('project-ref')).toBe(
      '/project/project-ref/settings/infrastructure'
    )
  })

  it('falls back to the default project placeholder', () => {
    expect(getInfrastructurePath()).toBe('/project/_/settings/infrastructure')
  })
})
