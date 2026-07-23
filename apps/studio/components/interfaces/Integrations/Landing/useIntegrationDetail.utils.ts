import type { IntegrationDefinition } from './Integrations.constants'

export type InstallActionType = 'oauth' | 'add-wrapper' | 'installed' | 'install-sheet' | null

/**
 * Returns which install action type to render for an integration.
 */
export function getInstallActionType({
  integration,
  isInstalled,
}: {
  integration: IntegrationDefinition | undefined
  isInstalled: boolean
}): InstallActionType {
  if (!integration) return null
  if (integration.type === 'oauth') return 'oauth'
  if (integration.type === 'wrapper') return 'add-wrapper'
  if (isInstalled) return 'installed'
  return 'install-sheet'
}
