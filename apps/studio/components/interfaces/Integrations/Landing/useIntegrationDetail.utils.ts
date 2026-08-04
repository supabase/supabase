import type { IntegrationDefinition, Navigation } from './Integrations.constants'

export type InstallActionType = 'oauth' | 'add-wrapper' | 'installed' | 'install-sheet' | null

export type DatabaseExtension = {
  name: string
  installed_version: string | null
}

/**
 * Returns whether all required extensions for an integration are enabled in the database.
 */
export function areRequiredExtensionsInstalledFor(
  integration: IntegrationDefinition | undefined,
  extensions: DatabaseExtension[] | undefined
): boolean {
  if (!integration?.requiredExtensions?.length || !extensions) return false
  return integration.requiredExtensions.every(
    (name) => !!extensions.find((ext) => ext.name === name)?.installed_version
  )
}

/**
 * Returns the filtered navigation items for an integration based on install / feature-flag state.
 * If the marketplace flag is off, only expose the Wrappers tab once extensions are installed
 */
export function getFilteredNavItems({
  integration,
  isInstalled,
  isMarketplaceEnabled,
  areRequiredExtensionsInstalled,
}: {
  integration: IntegrationDefinition | undefined
  isInstalled: boolean
  isMarketplaceEnabled: boolean
  areRequiredExtensionsInstalled: boolean
}): Navigation[] {
  if (!integration?.navigation) return []
  if (isInstalled || integration.type !== 'wrapper') return integration.navigation
  if (isMarketplaceEnabled || areRequiredExtensionsInstalled) return integration.navigation
  return integration.navigation.filter((nav) => nav.route !== 'wrappers')
}

/**
 * Returns which install action type to render for an integration.
 */
export function getInstallActionType({
  integration,
  isMarketplaceEnabled,
  areRequiredExtensionsInstalled,
  isInstalled,
}: {
  integration: IntegrationDefinition | undefined
  isMarketplaceEnabled: boolean
  areRequiredExtensionsInstalled: boolean
  isInstalled: boolean
}): InstallActionType {
  if (!integration) return null
  if (integration.type === 'oauth') return 'oauth'
  if (integration.type === 'wrapper' && (isMarketplaceEnabled || areRequiredExtensionsInstalled)) {
    return 'add-wrapper'
  }
  if (isInstalled) return 'installed'
  return 'install-sheet'
}
