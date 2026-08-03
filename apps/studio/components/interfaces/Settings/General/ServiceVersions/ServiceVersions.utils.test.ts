import { describe, expect, it } from 'vitest'

import { getServiceVersionsPath } from './ServiceVersions.utils'

describe('getServiceVersionsPath', () => {
  it('links directly to the Service versions section in General settings', () => {
    expect(getServiceVersionsPath('project-ref')).toBe(
      '/project/project-ref/settings/general#service-versions'
    )
  })

  it('uses the project placeholder while the selected project is unavailable', () => {
    expect(getServiceVersionsPath()).toBe('/project/_/settings/general#service-versions')
  })
})
