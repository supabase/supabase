import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import {
  getMaxReplicas,
  getReadReplicas,
  READ_REPLICA_COMPUTE_CAPS,
  READ_REPLICAS_MAX_COUNT,
} from './replicas-query'
import { addAPIMock } from '@/tests/lib/msw'

describe('getMaxReplicas', () => {
  it.each([
    ['ci_pico', 0],
    ['ci_nano', 0],
    ['ci_micro', 0],
    ['ci_small', 4],
    ['ci_medium', 4],
    ['ci_large', 4],
    ['ci_xlarge', READ_REPLICAS_MAX_COUNT],
    ['ci_2xlarge', READ_REPLICAS_MAX_COUNT],
    ['unknown_tier', READ_REPLICAS_MAX_COUNT],
    [undefined, READ_REPLICAS_MAX_COUNT],
  ])('returns the replica cap for compute %s', (compute, expected) => {
    expect(getMaxReplicas(compute)).toBe(expected)
  })

  it('all eligible READ_REPLICA_COMPUTE_CAPS are greater than 0 and at most READ_REPLICAS_MAX_COUNT', () => {
    for (const [, cap] of Object.entries(READ_REPLICA_COMPUTE_CAPS)) {
      if (cap > 0) {
        expect(cap).toBeLessThanOrEqual(READ_REPLICAS_MAX_COUNT)
      }
    }
  })
})

describe('getReadReplicas', () => {
  it('forwards the given headers on the request', async () => {
    let receivedAuthHeader: string | null = null

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/databases',
      response: ({ request }) => {
        receivedAuthHeader = request.headers.get('Authorization')
        return HttpResponse.json([])
      },
    })

    await getReadReplicas({ projectRef: 'default' }, undefined, {
      Authorization: 'Bearer test-token',
    })

    expect(receivedAuthHeader).toBe('Bearer test-token')
  })
})
