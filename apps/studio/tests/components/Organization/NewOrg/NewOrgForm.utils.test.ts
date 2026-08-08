import { describe, expect, test } from 'vitest'

import { findDuplicateOrganizationByName } from '@/components/interfaces/Organization/NewOrg/NewOrgForm.utils'

describe('findDuplicateOrganizationByName', () => {
  const organizations = [{ name: 'Acme Inc.' }, { name: 'Personal' }, { name: 'my org' }]

  test('finds an exact name match', () => {
    expect(findDuplicateOrganizationByName(organizations, 'Acme Inc.')).toBe(organizations[0])
  })

  test('matches case-insensitively', () => {
    expect(findDuplicateOrganizationByName(organizations, 'ACME INC.')).toBe(organizations[0])
    expect(findDuplicateOrganizationByName(organizations, 'My Org')).toBe(organizations[2])
  })

  test('matches ignoring surrounding whitespace', () => {
    expect(findDuplicateOrganizationByName(organizations, '  Acme Inc.  ')).toBe(organizations[0])
  })

  test('returns undefined when no organization matches', () => {
    expect(findDuplicateOrganizationByName(organizations, 'Something Else')).toBeUndefined()
  })

  test('returns undefined for an empty or whitespace-only name', () => {
    expect(findDuplicateOrganizationByName(organizations, '')).toBeUndefined()
    expect(findDuplicateOrganizationByName(organizations, '   ')).toBeUndefined()
  })

  test('returns undefined when organizations list is undefined', () => {
    expect(findDuplicateOrganizationByName(undefined, 'Acme Inc.')).toBeUndefined()
  })

  test('returns undefined when organizations list is empty', () => {
    expect(findDuplicateOrganizationByName([], 'Acme Inc.')).toBeUndefined()
  })
})
