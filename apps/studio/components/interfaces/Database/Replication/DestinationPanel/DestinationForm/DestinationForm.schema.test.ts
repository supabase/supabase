import { describe, expect, it } from 'vitest'

import { DestinationPanelFormSchema } from './DestinationForm.schema'

const requiredFields = {
  name: 'BigQuery warehouse',
  publicationName: 'analytics_publication',
}

describe('DestinationPanelFormSchema', () => {
  it.each([0, 1, 65535])('accepts a maximum staleness of %i whole minutes', (value) => {
    const result = DestinationPanelFormSchema.safeParse({
      ...requiredFields,
      maxStalenessMins: value,
    })

    expect(result.success).toBe(true)
  })

  it.each([-1, 1.5, 65536])('rejects an unsupported maximum staleness of %s', (value) => {
    const result = DestinationPanelFormSchema.safeParse({
      ...requiredFields,
      maxStalenessMins: value,
    })

    expect(result.success).toBe(false)
  })
})
