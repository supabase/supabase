import { describe, it, expect } from 'vitest'
import { passwordSchema } from './schemas'

describe('passwordSchema', () => {
  it('validates a basic password', async () => {
    const result = await passwordSchema.validate({ password: 'ValidPassword123!' })
    expect(result.password).toBe('ValidPassword123!')
  })
})
