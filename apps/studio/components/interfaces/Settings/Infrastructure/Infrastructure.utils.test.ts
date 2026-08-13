import { describe, expect, it } from 'vitest'

import {
  getAddReadReplicaPath,
  getInfrastructurePath,
  getReadReplicaPath,
} from './Infrastructure.utils'

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

describe('getReadReplicaPath', () => {
  it('builds the replica detail path', () => {
    expect(getReadReplicaPath('project-ref', 'replica-1')).toBe(
      '/project/project-ref/settings/infrastructure/replica/replica-1'
    )
  })
})

describe('getAddReadReplicaPath', () => {
  it('opens the add-replica sheet on infrastructure', () => {
    expect(getAddReadReplicaPath('project-ref')).toBe(
      '/project/project-ref/settings/infrastructure?addReplica=true'
    )
  })
})
