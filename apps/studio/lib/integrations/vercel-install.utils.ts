export function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) return error.message
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message
  }
  return undefined
}

export type VercelInstallSource = 'deploy-button' | 'marketplace' | 'external'

/**
 * Vercel sometimes sends source=marketplace with Deploy Button params
 * (currentProjectId + external-id). Treat that as deploy-button for routing.
 */
export function hasVercelDeployButtonSignals({
  currentProjectId,
  externalId,
}: {
  currentProjectId?: string
  externalId?: string
}): boolean {
  return Boolean(currentProjectId && externalId)
}

export function resolveVercelInstallSource({
  source,
  currentProjectId,
  externalId,
}: {
  source: string | undefined
  currentProjectId?: string
  externalId?: string
}): VercelInstallSource | undefined {
  if (hasVercelDeployButtonSignals({ currentProjectId, externalId })) {
    return 'deploy-button'
  }

  switch (source) {
    case 'deploy-button':
    case 'marketplace':
    case 'external':
      return source
    default:
      return undefined
  }
}

type BuildVercelInstallRouteQueryArgs = {
  source?: VercelInstallSource
  organizationSlug?: string
  configurationId?: string
  currentProjectId?: string
  externalId?: string
  next?: string
}

function removeUndefinedValues(query: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(query).filter((entry): entry is [string, string] => entry[1] !== undefined)
  )
}

export function buildVercelInstallRouteQuery({
  source,
  organizationSlug,
  configurationId,
  currentProjectId,
  externalId,
  next,
}: BuildVercelInstallRouteQueryArgs) {
  switch (source) {
    case 'deploy-button':
      return removeUndefinedValues({
        organizationSlug,
        currentProjectId,
        externalId,
        next,
      })
    case 'marketplace':
    case 'external':
      // Keep Deploy Button ids when present so choose-project → create can seed + link.
      return removeUndefinedValues({
        organizationSlug,
        configurationId,
        currentProjectId,
        externalId,
        next,
      })
    default:
      return removeUndefinedValues({ organizationSlug })
  }
}
