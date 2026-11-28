import { useQuery } from '@tanstack/react-query'
import { getMcpUrl } from 'ui-patterns/McpUrlBuilder/utils/getMcpUrl'

import { buildAgentPrompt } from './AgentPromptSection.utils'
import { getAddons } from '@/components/interfaces/Billing/Subscription/Subscription.utils'
import { useConnectionStringDatabases } from '@/components/interfaces/ConnectSheet/useConnectionStringDatabases'
import { JWKS_DISCOVERY_PATH } from '@/components/interfaces/ConnectSheet/useConnectServerEnv'
import { apiKeysQueryOptions, getKeys } from '@/data/api-keys/api-keys-query'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'
import { useDeploymentMode } from '@/hooks/misc/useDeploymentMode'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { BASE_PATH, IS_PLATFORM } from '@/lib/constants'
import { useGrant } from '@/lib/grants'

/** Absolute dashboard URL for a project page, so an agent can hand the link to the person. */
const getDashboardUrl = (path: string) =>
  typeof window === 'undefined' ? undefined : `${window.location.origin}${BASE_PATH}${path}`

/**
 * Gathers the non-secret connection details the Connect sheet shows (URL,
 * publishable key, JWKS URL, MCP URL and every Postgres connection string) and
 * builds the agent setup prompt from them. Secrets stay out: the prompt links
 * to where the person can find them instead.
 */
export function useAgentPrompt() {
  const { data: project } = useSelectedProjectQuery()
  const projectRef = project?.ref
  const deploymentMode = useDeploymentMode()

  const { data: apiUrl } = useProjectApiUrl({ projectRef })
  const apiKeysGrant = useGrant('GET /v1/projects/{ref}/api-keys', { projectRef })
  const { data: apiKeys } = useQuery(
    apiKeysQueryOptions({ projectRef, grant: apiKeysGrant.grant }, { select: getKeys })
  )
  const publishableKey = apiKeys?.publishableKey?.api_key ?? apiKeys?.anonKey?.api_key ?? null

  const connectionStringsByDatabase = useConnectionStringDatabases(deploymentMode)
  const primaryConnectionStrings = projectRef ? connectionStringsByDatabase[projectRef] : undefined

  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const { ipv4: ipv4Addon } = getAddons(addons?.selected_addons ?? [])

  const { mcpUrl } = getMcpUrl({ projectRef, isPlatform: IS_PLATFORM, apiUrl: apiUrl ?? undefined })

  return buildAgentPrompt({
    projectName: project?.name,
    projectRef,
    apiUrl,
    publishableKey,
    jwksUrl: apiUrl ? new URL(JWKS_DISCOVERY_PATH, apiUrl).href : undefined,
    mcpUrl,
    connectionStrings: primaryConnectionStrings && {
      direct: primaryConnectionStrings.direct,
      sessionPooler: primaryConnectionStrings.sessionShared,
      transactionPooler: primaryConnectionStrings.transactionShared,
      dedicatedPooler: primaryConnectionStrings.transactionDedicated,
    },
    hasIpv4Addon: !!ipv4Addon,
    secretKeyUrl:
      IS_PLATFORM && projectRef
        ? getDashboardUrl(`/project/${projectRef}/settings/api-keys`)
        : undefined,
    databasePasswordUrl:
      IS_PLATFORM && projectRef
        ? getDashboardUrl(`/project/${projectRef}/database/settings`)
        : undefined,
    isPlatform: IS_PLATFORM,
  })
}
