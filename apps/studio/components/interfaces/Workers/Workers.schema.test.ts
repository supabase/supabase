import { describe, expect, it } from 'vitest'

import { CreateWorkerSchema } from './Workers.schema'

const valid = {
  name: 'embed',
  size: '2gb-1vcpu',
  access: 'private' as const,
  instances: 1,
}

const errorFor = (input: Record<string, unknown>, field: string) => {
  const result = CreateWorkerSchema.safeParse(input)
  if (result.success) return undefined
  return result.error.issues.find((issue) => issue.path[0] === field)?.message
}

describe('CreateWorkerSchema', () => {
  it('accepts a valid spec', () => {
    expect(CreateWorkerSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts hyphenated lowercase names', () => {
    expect(CreateWorkerSchema.safeParse({ ...valid, name: 'resize-images-v2' }).success).toBe(true)
  })

  it('rejects names the CLI slug rules disallow', () => {
    for (const name of ['Embed', 'embed_batch', '-embed', 'embed-', 'em--bed', 'embed images']) {
      expect(errorFor({ ...valid, name }, 'name')).toBe(
        'Lowercase letters, numbers, and hyphens only'
      )
    }
  })

  it('requires a name', () => {
    expect(errorFor({ ...valid, name: '   ' }, 'name')).toBe('Provide a name for your worker')
  })

  it('caps the name length', () => {
    expect(errorFor({ ...valid, name: 'a'.repeat(49) }, 'name')).toBe('Use 48 characters or fewer')
  })

  it('holds instances within the alpha range', () => {
    expect(errorFor({ ...valid, instances: 0 }, 'instances')).toBe('At least 1 instance')
    expect(errorFor({ ...valid, instances: 11 }, 'instances')).toBe('At most 10 instances')
    expect(errorFor({ ...valid, instances: 1.5 }, 'instances')).toBe('Whole numbers only')
  })

  it('coerces the instance count the number input reports as a string', () => {
    const result = CreateWorkerSchema.safeParse({ ...valid, instances: '3' })
    expect(result.success && result.data.instances).toBe(3)
  })

  it('rejects an access value the API does not accept', () => {
    expect(CreateWorkerSchema.safeParse({ ...valid, access: 'internal' }).success).toBe(false)
  })
})
