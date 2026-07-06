export type ExposedEntityStatus = 'granted' | 'revoked' | 'custom'

type ExposedEntityStatusItem = {
  name: string
  status: ExposedEntityStatus
}

export type FilteredDocsEntities<T> = {
  visibleEntities: T[]
  excludedCount: number
}

/**
 * Splits the entities listed in the PostgREST OpenAPI spec into those that are
 * actually accessible via the Data API and those that are not.
 *
 * An entity is considered exposed when it has at least one API-role grant
 * (`granted` or `custom`). It is excluded only when every entry matching its
 * name is `revoked` (no API role has any privilege) — mirroring the
 * granted/custom/revoked classification used by the Data API settings page.
 *
 * Fails open: when the grant statuses haven't loaded (or errored), all spec
 * entities are returned so the docs are never blanked out.
 */
export function partitionExposedDocsEntities<T extends { name: string }>(
  specEntities: T[],
  exposedStatuses: ExposedEntityStatusItem[] | undefined
): FilteredDocsEntities<T> {
  if (!exposedStatuses) {
    return { visibleEntities: specEntities, excludedCount: 0 }
  }

  const accessibleNames = new Set<string>()
  const revokedNames = new Set<string>()
  for (const { name, status } of exposedStatuses) {
    if (status === 'revoked') {
      revokedNames.add(name)
    } else {
      accessibleNames.add(name)
    }
  }

  const visibleEntities: T[] = []
  let excludedCount = 0
  for (const entity of specEntities) {
    const isExcluded = revokedNames.has(entity.name) && !accessibleNames.has(entity.name)
    if (isExcluded) {
      excludedCount += 1
    } else {
      visibleEntities.push(entity)
    }
  }

  return { visibleEntities, excludedCount }
}
