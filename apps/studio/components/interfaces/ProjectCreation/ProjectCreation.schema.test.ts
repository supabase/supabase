import { describe, expect, test } from 'vitest'

import { FormSchema, type CreateProjectForm } from './ProjectCreation.schema'

const validProject: CreateProjectForm = {
  organization: 'default-org',
  projectName: 'Region Project',
  highAvailability: false,
  postgresVersion: '',
  dbRegion: 'Americas',
  cloudProvider: 'AWS',
  dbPass: 'strong-database-password',
  dbPassStrength: 4,
  dbPassStrengthMessage: '',
  dbPassStrengthWarning: '',
  githubRepositoryId: '',
  githubRepositoryName: '',
  dataApi: true,
  dataApiDefaultPrivileges: true,
  enableRlsEventTrigger: false,
  postgresVersionSelection: '',
  useOrioleDb: false,
  shouldRunMigrations: true,
}

describe('project creation region validation', () => {
  test.each([undefined, '', '   '])('rejects a missing region (%j)', async (dbRegion) => {
    const result = await FormSchema.safeParseAsync({ ...validProject, dbRegion })

    expect(result.success).toBe(false)
    if (result.success) throw new Error('Expected region validation to fail')
    expect(result.error.issues).toEqual([
      expect.objectContaining({ path: ['dbRegion'], message: 'Please select a region.' }),
    ])
  })

  test.each(['Americas', 'East US (North Virginia)'])(
    'accepts a selected region (%s)',
    async (dbRegion) => {
      expect((await FormSchema.safeParseAsync({ ...validProject, dbRegion })).success).toBe(true)
    }
  )
})
