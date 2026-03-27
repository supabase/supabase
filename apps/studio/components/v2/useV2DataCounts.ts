'use client'

import { useQuery } from '@tanstack/react-query'
import { useInstalledIntegrations } from 'components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { useUsersCountQuery } from 'data/auth/users-count-query'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useDatabaseFunctionsQuery } from 'data/database-functions/database-functions-query'
import { useDatabaseTriggersQuery } from 'data/database-triggers/database-triggers-query'
import { useDatabasePublicationsQuery } from 'data/database-publications/database-publications-query'
import { useDatabaseRolesQuery } from 'data/database-roles/database-roles-query'
import { useIndexesQuery } from 'data/database-indexes/indexes-query'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { useEnumeratedTypesQuery } from 'data/enumerated-types/enumerated-types-query'
import { isValidConnString } from 'data/fetchers'
import { useOAuthServerAppsQuery } from 'data/oauth-server-apps/oauth-server-apps-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { getBuckets } from 'data/storage/buckets-query'
import { storageKeys } from 'data/storage/keys'
import { useTablesQuery } from 'data/tables/tables-query'
import { thirdPartyAuthIntegrationsQueryOptions } from 'data/third-party-auth/integrations-query'
import { PROJECT_STATUS } from 'lib/constants'

export function useV2DataCounts(projectRef: string | undefined) {
  const { data: project } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )
  const conn = project?.connectionString
  const canQueryDb = Boolean(projectRef) && isValidConnString(conn)
  const isProjectActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const { data: tables } = useTablesQuery(
    {
      projectRef,
      connectionString: conn,
      schema: 'public',
      includeColumns: false,
    },
    { enabled: canQueryDb }
  )
  const { data: usersCount } = useUsersCountQuery(
    {
      projectRef,
      connectionString: conn,
      keywords: '',
      filter: undefined,
      providers: [],
      forceExactCount: false,
    },
    { enabled: canQueryDb }
  )
  const { data: bucketsData } = useQuery({
    queryKey: storageKeys.buckets(projectRef),
    queryFn: ({ signal }) => getBuckets({ projectRef }, signal),
    enabled: Boolean(projectRef) && isProjectActive,
  })
  const { data: edgeFunctions } = useEdgeFunctionsQuery(
    { projectRef },
    { enabled: Boolean(projectRef) }
  )
  const { data: extensions } = useDatabaseExtensionsQuery(
    { projectRef, connectionString: conn },
    { enabled: canQueryDb }
  )
  const { data: roles } = useDatabaseRolesQuery(
    { projectRef, connectionString: conn },
    { enabled: canQueryDb }
  )
  const { data: publications } = useDatabasePublicationsQuery(
    { projectRef, connectionString: conn },
    { enabled: canQueryDb }
  )
  const { data: types } = useEnumeratedTypesQuery(
    { projectRef, connectionString: conn },
    { enabled: canQueryDb }
  )
  const { data: dbFunctions } = useDatabaseFunctionsQuery(
    { projectRef, connectionString: conn },
    { enabled: canQueryDb }
  )
  const { data: dbTriggers } = useDatabaseTriggersQuery(
    { projectRef, connectionString: conn },
    { enabled: canQueryDb }
  )

  const { data: indexes } = useIndexesQuery(
    { projectRef, connectionString: conn, schema: 'public' },
    { enabled: canQueryDb }
  )

  const { data: thirdPartyAuth } = useQuery(
    thirdPartyAuthIntegrationsQueryOptions({ projectRef })
  )

  const { data: oauthAppsData } = useOAuthServerAppsQuery({ projectRef })
  const { installedIntegrations } = useInstalledIntegrations()

  const bucketsList = Array.isArray(bucketsData) ? bucketsData : []
  const edgeFunctionsList = Array.isArray(edgeFunctions) ? edgeFunctions : []

  return {
    tables: Array.isArray(tables) ? tables.length : 0,
    users: usersCount?.count ?? 0,
    buckets: bucketsList.length,
    edgeFunctions: edgeFunctionsList.length,
    extensions: extensions?.length ?? 0,
    roles: roles?.length ?? 0,
    publications: publications?.length ?? 0,
    types: types?.length ?? 0,
    functions: dbFunctions?.length ?? 0,
    triggers: dbTriggers?.length ?? 0,
    indexes: Array.isArray(indexes) ? indexes.length : 0,
    providers: Array.isArray(thirdPartyAuth) ? thirdPartyAuth.length : 0,
    oauthApps: oauthAppsData?.clients?.length ?? 0,
    integrations: installedIntegrations.length,
    /** Realtime channels — v2 data UI is not wired to an API yet */
    channels: 0,
  }
}
