import { useMemo } from 'react'

import { useProjectLogStatsQuery } from 'data/analytics/project-log-stats-query'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useUsersCountQuery } from 'data/auth/users-count-query'
import { useContentInfiniteQuery } from 'data/content/content-infinite-query'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useMigrationsQuery } from 'data/database/migrations-query'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'

type GettingStartedStatuses = {
  hasTables: boolean
  hasCliSetup: boolean
  hasSampleData: boolean
  hasRlsPolicies: boolean
  hasAppConnected: boolean
  hasFirstUser: boolean
  hasStorageObjects: boolean
  hasEdgeFunctions: boolean
  hasReports: boolean
  hasGitHubConnection: boolean
}

export const useGettingStartedProgress = (): GettingStartedStatuses => {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()

  const projectRef = project?.ref
  const connectionString = project?.connectionString
  const isProjectActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const { data: tablesData } = useTablesQuery(
    { projectRef, connectionString, schema: 'public' },
    { enabled: !!projectRef && isProjectActive }
  )

  const { data: storageTablesData } = useTablesQuery(
    { projectRef, connectionString, schema: 'storage' },
    { enabled: !!projectRef && isProjectActive }
  )

  const { data: policiesData } = useDatabasePoliciesQuery(
    { projectRef, connectionString, schema: 'public' },
    { enabled: !!projectRef && !!connectionString && isProjectActive }
  )

  const { data: authConfig } = useAuthConfigQuery(
    { projectRef },
    { enabled: !!projectRef && isProjectActive }
  )

  const { data: usersCountData } = useUsersCountQuery(
    { projectRef, connectionString },
    { enabled: !!projectRef && !!connectionString && isProjectActive }
  )

  const { data: edgeFunctionsData } = useEdgeFunctionsQuery(
    { projectRef },
    { enabled: !!projectRef && isProjectActive }
  )

  const { data: reportsData } = useContentInfiniteQuery(
    { projectRef, type: 'report', limit: 1 },
    { enabled: !!projectRef && isProjectActive }
  )

  const { data: migrationsData } = useMigrationsQuery(
    { projectRef, connectionString },
    { enabled: !!projectRef && !!connectionString && isProjectActive }
  )

  const { data: usageStatsData } = useProjectLogStatsQuery(
    { projectRef, interval: '1day' },
    { enabled: !!projectRef && isProjectActive }
  )

  const { data: githubConnections } = useGitHubConnectionsQuery(
    { organizationId: organization?.id },
    { enabled: !!projectRef && !!organization?.id }
  )

  const statuses = useMemo<GettingStartedStatuses>(() => {
    const hasTables = (tablesData?.length ?? 0) > 0
    const hasCliSetup = (migrationsData?.length ?? 0) > 0
    const hasSampleData = (tablesData ?? []).some(
      (table) => Number(table?.live_rows_estimate ?? 0) > 0
    )
    const hasRlsPolicies = (policiesData?.length ?? 0) > 0
    const allowSignupsEnabled = authConfig ? !authConfig.DISABLE_SIGNUP : false
    const emailProviderEnabled = !!authConfig?.EXTERNAL_EMAIL_ENABLED
    const hasFirstUser = !!usersCountData && !usersCountData.is_estimate && usersCountData.count > 0
    const hasStorageObjects = (storageTablesData ?? []).some(
      (table) => table.name === 'objects' && Number(table?.live_rows_estimate ?? 0) > 0
    )
    const hasEdgeFunctions = (edgeFunctionsData?.length ?? 0) > 0
    const hasReports = (reportsData?.pages?.[0]?.content?.length ?? 0) > 0
    const hasGitHubConnection =
      githubConnections?.some((connection) => connection.project.ref === projectRef) ?? false
    const hasAppConnected =
      usageStatsData?.result?.some((row) => {
        const totals = [
          row.total_auth_requests,
          row.total_storage_requests,
          row.total_rest_requests,
          row.total_realtime_requests,
        ]
        return totals.some((value) => (value ?? 0) > 0)
      }) ?? false

    return {
      hasTables,
      hasCliSetup,
      hasSampleData,
      hasRlsPolicies,
      hasAppConnected,
      hasFirstUser,
      hasStorageObjects,
      hasEdgeFunctions,
      hasReports,
      hasGitHubConnection,
    }
  }, [
    authConfig,
    edgeFunctionsData,
    githubConnections,
    migrationsData,
    policiesData,
    reportsData,
    storageTablesData,
    tablesData,
    usageStatsData,
    usersCountData,
    projectRef,
  ])

  return statuses
}

export type { GettingStartedStatuses }
