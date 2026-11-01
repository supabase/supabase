import { describe, expect, test } from 'vitest'

import { replicationKeys } from './keys'
import { pipelineIdSchema } from './pipeline-id'

describe('pipeline cache keys', () => {
  test.each([
    replicationKeys.pipelineById,
    replicationKeys.pipelinesStatus,
    replicationKeys.pipelinesReplicationStatus,
    replicationKeys.pipelinesVersion,
  ])('%s shares numeric and string pipeline identities', (key) => {
    expect(key('project', pipelineIdSchema.parse(42))).toEqual(key('project', '42'))
    expect(key('project', '003l8j9rxqi6c8rd5mcx1w2ya')[3]).toBe('003l8j9rxqi6c8rd5mcx1w2ya')
    expect(key('project', undefined)[3]).toBeUndefined()
  })
})
