import { describe, expect, test } from 'vitest'

import {
  FormSchema,
  ORIOLE_NOT_SUPPORTED_ON_V3_MESSAGE,
  type CreateProjectForm,
} from './ProjectCreation.schema'

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
  test.each([undefined, '', '   '])('rejects a missing region (%j)', (dbRegion) => {
    const result = FormSchema.safeParse({ ...validProject, dbRegion })

    expect(result.success).toBe(false)
    if (result.success) throw new Error('Expected region validation to fail')
    expect(result.error.issues).toEqual([
      expect.objectContaining({ path: ['dbRegion'], message: 'Please select a region.' }),
    ])
  })

  test.each(['Americas', 'East US (North Virginia)'])(
    'accepts a selected region (%s)',
    (dbRegion) => {
      expect(FormSchema.safeParse({ ...validProject, dbRegion }).success).toBe(true)
    }
  )
})

describe('project creation OrioleDB validation', () => {
  test('rejects OrioleDB on AWS (Revamped)', () => {
    const result = FormSchema.safeParse({
      ...validProject,
      cloudProvider: 'AWS_K8S',
      useOrioleDb: true,
    })

    expect(result.success).toBe(false)
    if (result.success) throw new Error('Expected OrioleDB validation to fail')
    expect(result.error.issues).toEqual([
      expect.objectContaining({
        path: ['useOrioleDb'],
        message: ORIOLE_NOT_SUPPORTED_ON_V3_MESSAGE,
      }),
    ])
  })

  test('accepts OrioleDB on AWS', () => {
    expect(FormSchema.safeParse({ ...validProject, useOrioleDb: true }).success).toBe(true)
  })

  test('accepts Postgres on AWS (Revamped)', () => {
    expect(FormSchema.safeParse({ ...validProject, cloudProvider: 'AWS_K8S' }).success).toBe(true)
  })
})
