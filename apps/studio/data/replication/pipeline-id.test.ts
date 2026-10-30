import { describe, expect, test } from 'vitest'

import { pipelineIdSchema } from './pipeline-id'

describe('pipeline ID normalization', () => {
  test.each([42, '42', '003l8j9rxqi6c8rd5mcx1w2ya'])(
    'normalizes API pipeline ID %s to a string',
    (id) => {
      expect(pipelineIdSchema.parse(id)).toBe(String(id))
    }
  )
})
