import { useFlag, useParams } from 'common'
import type { Hook } from 'components/interfaces/Auth/Hooks/hooks.constants'
import { HOOKS_DEFINITIONS } from 'components/interfaces/Auth/Hooks/hooks.constants'
import { extractMethod, isValidHook } from 'components/interfaces/Auth/Hooks/hooks.utils'
import {
  INTEGRATIONS,
  type IntegrationDefinition,
} from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { useInstalledIntegrations } from 'components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import {
  useIsAnalyticsBucketsEnabled,
  useIsVectorBucketsEnabled,
} from 'data/config/project-storage-config-query'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useMemo } from 'react'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { useSetPage } from 'ui-patterns/CommandMenu'

export function getIntegrationRoute(
  integration: IntegrationDefinition,
  ref: string,
  installedIntegrationIds: Set<string>
): string | null {
  // For wrappers, route to overview with new=true (always available if wrappers feature is enabled)
  if (integration.type === 'wrapper') {
    return `/project/${ref}/integrations/${integration.id}/overview?new=true`
  }

  // For non-wrapper integrations, check if installed and determine route
  if (!installedIntegrationIds.has(integration.id)) {
    return null
  }

  // Map integration IDs to their create routes
  switch (integration.id) {
    case 'vault':
      return `/project/${ref}/integrations/vault/secrets?new=true`
    case 'cron':
      return `/project/${ref}/integrations/cron/jobs?new=true`
    case 'webhooks':
      return `/project/${ref}/integrations/webhooks/webhooks?new=true`
    case 'queues':
      return `/project/${ref}/integrations/queues/queues?new=true`
    // Data API and GraphiQL don't have a create route
    case 'data_api':
    case 'graphiql':
      return null
    default: {
      // For other integrations, try to find a navigation route that's not 'overview'
      const createRoute = integration.navigation?.find((nav) => nav.route !== 'overview')
      if (createRoute) {
        return `/project/${ref}/integrations/${integration.id}/${createRoute.route}?new=true`
      }
      return null
    }
  }
}

export function getIntegrationCommandName(integration: IntegrationDefinition): string {
  if (integration.type === 'wrapper') {
    // Extract the wrapper name (e.g., "Stripe Wrapper" -> "Stripe")
    const wrapperName = integration.name.replace(' Wrapper', '')
    return `Add ${wrapperName} wrapper`
  }

  // Map integration IDs to their command names
  switch (integration.id) {
    case 'vault':
      return 'Create Vault Secret'
    case 'cron':
      return 'Create Cron Job'
    case 'webhooks':
      return 'Create Webhook'
    case 'queues':
      return 'Create Queue'
    default:
      return `Create ${integration.name}`
  }
}

export function useCreateCommandsConfig() {
  let { ref } = useParams()
  ref ||= '_'
  const setPage = useSetPage()
  const { openSidebar } = useSidebarManagerSnapshot()
  const snap = useAiAssistantStateSnapshot()

  // Auth
  const authenticationOauth21 = useFlag('EnableOAuth21')

  const {
    projectAuthAll: authEnabled,
    projectEdgeFunctionAll: edgeFunctionsEnabled,
    projectStorageAll: storageEnabled,
    reportsAll: reportsEnabled,
    integrationsWrappers: integrationsWrappersEnabled,
  } = useIsFeatureEnabled([
    'project_auth:all',
    'project_edge_function:all',
    'project_storage:all',
    'reports:all',
    'integrations:wrappers',
  ])

  const {
    data: authConfig,
    isError: isAuthConfigError,
    isPending: isAuthConfigLoading,
  } = useAuthConfigQuery({ projectRef: ref })

  const { getEntitlementSetValues: getEntitledHookSet } = useCheckEntitlements('auth.hooks')
  const entitledHookSet = getEntitledHookSet()

  const { nonAvailableHooks } = useMemo(() => {
    const allHooks: Hook[] = HOOKS_DEFINITIONS.map((definition) => ({
      ...definition,
      enabled: authConfig?.[definition.enabledKey] || false,
      method: extractMethod(
        authConfig?.[definition.uriKey] || '',
        authConfig?.[definition.secretsKey] || ''
      ),
    }))

    const nonAvailableHooks: string[] = allHooks
      .filter((h) => !isValidHook(h) && !entitledHookSet.includes(h.entitlementKey))
      .map((h) => h.entitlementKey)

    return { nonAvailableHooks }
  }, [entitledHookSet, authConfig])

  const showAuthConfig = !isAuthConfigError && !isAuthConfigLoading

  const sendSmsHook = HOOKS_DEFINITIONS.find((hook) => hook.id === 'send-sms')
  const sendEmailHook = HOOKS_DEFINITIONS.find((hook) => hook.id === 'send-email')
  const customAccessTokenHook = HOOKS_DEFINITIONS.find(
    (hook) => hook.id === 'custom-access-token-claims'
  )
  const mfaVerificationHook = HOOKS_DEFINITIONS.find(
    (hook) => hook.id === 'mfa-verification-attempt'
  )
  const mfaVerificationHookEnabled =
    showAuthConfig &&
    mfaVerificationHook &&
    nonAvailableHooks.includes(mfaVerificationHook.entitlementKey)
  const passwordVerificationHook = HOOKS_DEFINITIONS.find(
    (hook) => hook.id === 'password-verification-attempt'
  )
  const passwordVerificationHookEnabled =
    showAuthConfig &&
    passwordVerificationHook &&
    nonAvailableHooks.includes(passwordVerificationHook.entitlementKey)
  const beforeUserCreatedHook = HOOKS_DEFINITIONS.find((hook) => hook.id === 'before-user-created')

  // Storage
  const { data: organization } = useSelectedOrganizationQuery()
  const isFreePlan = organization?.plan.id === 'free'
  const isVectorBucketsEnabled = useIsVectorBucketsEnabled({ projectRef: ref })
  const isAnalyticsBucketsEnabled = useIsAnalyticsBucketsEnabled({ projectRef: ref })

  // Integrations
  const { installedIntegrations } = useInstalledIntegrations()

  const installedIntegrationIds = useMemo(
    () => new Set(installedIntegrations.map((integration) => integration.id)),
    [installedIntegrations]
  )

  const allIntegrations = useMemo(
    () =>
      integrationsWrappersEnabled
        ? INTEGRATIONS
        : INTEGRATIONS.filter((x) => !x.id.endsWith('_wrapper')),
    [integrationsWrappersEnabled]
  )

  return {
    ref,
    setPage,
    openSidebar,
    snap,
    authenticationOauth21,
    authEnabled,
    edgeFunctionsEnabled,
    storageEnabled,
    sendSmsHook,
    sendEmailHook,
    customAccessTokenHook,
    mfaVerificationHook,
    mfaVerificationHookEnabled,
    passwordVerificationHook,
    passwordVerificationHookEnabled,
    beforeUserCreatedHook,
    isFreePlan,
    isVectorBucketsEnabled,
    isAnalyticsBucketsEnabled,
    installedIntegrationIds,
    integrationsWrappers: integrationsWrappersEnabled,
    allIntegrations,
    reportsEnabled,
  }
}
