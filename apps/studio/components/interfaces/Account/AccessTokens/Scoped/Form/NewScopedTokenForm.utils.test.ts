import dayjs from 'dayjs'
import { describe, expect, test } from 'vitest'

import { TokenFormSchema } from './NewScopedTokenForm.utils'

const BASE_VALUES = {
  tokenName: 'test',
  expiresAt: 'custom',
  resourceAccess: 'account',
  organizationSlugs: [],
  projectRefs: [],
  permissions: {},
}

describe('TokenFormSchema custom expiry', () => {
  test('requires a date when the preset is custom', () => {
    const result = TokenFormSchema.safeParse(BASE_VALUES)
    expect(result.success).toBe(false)
  })
  test('accepts a date within one year from today', () => {
    const result = TokenFormSchema.safeParse({
      ...BASE_VALUES,
      customExpiryDate: dayjs().add(1, 'year').startOf('day').toISOString(),
    })
    expect(result.success).toBe(true)
  })
  test('rejects a date more than one year from today', () => {
    const result = TokenFormSchema.safeParse({
      ...BASE_VALUES,
      customExpiryDate: dayjs().add(1, 'year').add(1, 'day').endOf('day').toISOString(),
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      'Expiry date must be within one year from today'
    )
  })
})
