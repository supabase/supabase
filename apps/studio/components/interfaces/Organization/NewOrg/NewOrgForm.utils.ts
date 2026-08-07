import { useMemo } from 'react'

import { Organization } from '@/types'

export function useFindDuplicatedOrganizationByName(
  name: string,
  organizations: Organization[] | undefined
) {
  return useMemo(
    () => findDuplicateOrganizationByName(organizations, name ?? ''),
    [organizations, name]
  )
}

export function findDuplicateOrganizationByName<T extends { name: string }>(
  organizations: T[] | undefined,
  name: string
): T | undefined {
  const trimmedName = name.trim().toLowerCase()
  if (!trimmedName) return undefined

  return (organizations ?? []).find((org) => org.name.trim().toLowerCase() === trimmedName)
}
