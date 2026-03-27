import { useBranchesQuery } from 'data/branches/branches-query'
import { useEdgeFunctionServiceStatusQuery } from 'data/service-status/edge-functions-status-query'
import { useProjectServiceStatusQuery } from 'data/service-status/service-status-query'
import dayjs from 'dayjs'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { DOCS_URL } from 'lib/constants'

import { extractDbSchema, type ProjectServiceStatus } from '../Home/ServiceStatus'

export const SERVICE_STATUS_THRESHOLD_MINUTES = 5

export type ProjectHomeServiceStatusProject = {
  ref: string
  parentRef: string
  status?: string
  inserted_at?: string
} | undefined

export type ProjectHomeServiceRow = {
  name: string
  error?: string
  docsUrl?: string
  isLoading: boolean
  status: ProjectServiceStatus
  logsUrl: string
}

export type ProjectHomeServiceStatusModel = {
  services: ProjectHomeServiceRow[]
  isLoadingChecks: boolean
  allServicesOperational: boolean
  isProjectNew: boolean
  isProjectComingUp: boolean
  overallStatusLabel: string
}

export function useProjectHomeServiceStatusModel(
  projectRef: string | undefined,
  project: ProjectHomeServiceStatusProject
): ProjectHomeServiceStatusModel {
  const {
    projectAuthAll: authEnabled,
    projectEdgeFunctionAll: edgeFunctionsEnabled,
    realtimeAll: realtimeEnabled,
    projectStorageAll: storageEnabled,
  } = useIsFeatureEnabled([
    'project_auth:all',
    'project_edge_function:all',
    'realtime:all',
    'project_storage:all',
  ])

  const isBranch = Boolean(project && project.parentRef !== project.ref)

  const { data: branches, isPending: isBranchesLoading } = useBranchesQuery(
    { projectRef: isBranch ? project?.parentRef : undefined },
    { enabled: isBranch && Boolean(projectRef) }
  )

  const currentBranch = isBranch
    ? branches?.find((branch) => branch.project_ref === projectRef)
    : undefined

  const { data: status, isPending: isLoading } = useProjectServiceStatusQuery(
    { projectRef },
    {
      enabled: Boolean(projectRef),
      refetchInterval: (query) => {
        const data = query.state.data
        const isServiceUnhealthy = data?.some((service) => {
          if (service.name === 'rest' && extractDbSchema(service) === '') {
            return false
          }
          if (service.status === 'ACTIVE_HEALTHY') {
            return false
          }
          return true
        })

        return isServiceUnhealthy ? 5000 : false
      },
    }
  )

  const { data: edgeFunctionsStatus } = useEdgeFunctionServiceStatusQuery(
    { projectRef },
    {
      enabled: Boolean(projectRef),
      refetchInterval: (query) => (!query.state.data?.healthy ? 5000 : false),
    }
  )

  const authStatus = status?.find((service) => service.name === 'auth')
  const restStatus = status?.find((service) => service.name === 'rest')
  const realtimeStatus = status?.find((service) => service.name === 'realtime')
  const storageStatus = status?.find((service) => service.name === 'storage')
  const dbStatus = status?.find((service) => service.name === 'db')

  const isMigrationLoading =
    project?.status === 'COMING_UP' ||
    (isBranch &&
      (isBranchesLoading ||
        currentBranch?.status === 'CREATING_PROJECT' ||
        currentBranch?.status === 'RUNNING_MIGRATIONS'))

  const services: ProjectHomeServiceRow[] = [
    {
      name: 'Database',
      error: undefined,
      docsUrl: undefined,
      isLoading: isLoading,
      status: dbStatus?.status ?? 'UNHEALTHY',
      logsUrl: '/logs/postgres-logs',
    },
    {
      name: 'PostgREST',
      error: restStatus?.error,
      docsUrl: undefined,
      isLoading,
      status: extractDbSchema(restStatus) === '' ? 'DISABLED' : (restStatus?.status ?? 'UNHEALTHY'),
      logsUrl: '/logs/postgrest-logs',
    },
    ...(authEnabled
      ? [
          {
            name: 'Auth',
            error: authStatus?.error,
            docsUrl: undefined,
            isLoading,
            status: authStatus?.status ?? 'UNHEALTHY',
            logsUrl: '/logs/auth-logs',
          },
        ]
      : []),
    ...(realtimeEnabled
      ? [
          {
            name: 'Realtime',
            error: realtimeStatus?.error,
            docsUrl: undefined,
            isLoading,
            status: realtimeStatus?.status ?? 'UNHEALTHY',
            logsUrl: '/logs/realtime-logs',
          },
        ]
      : []),
    ...(storageEnabled
      ? [
          {
            name: 'Storage',
            error: storageStatus?.error,
            docsUrl: undefined,
            isLoading,
            status: storageStatus?.status ?? 'UNHEALTHY',
            logsUrl: '/logs/storage-logs',
          },
        ]
      : []),
    ...(edgeFunctionsEnabled
      ? [
          {
            name: 'Edge Functions',
            error: undefined,
            docsUrl: `${DOCS_URL}/guides/functions/troubleshooting`,
            isLoading,
            status: edgeFunctionsStatus?.healthy
              ? ('ACTIVE_HEALTHY' as const)
              : isLoading
                ? ('COMING_UP' as const)
                : ('UNHEALTHY' as const),
            logsUrl: '/logs/edge-functions-logs',
          },
        ]
      : []),
    ...(isBranch
      ? [
          {
            name: 'Migrations',
            error: undefined,
            docsUrl: undefined,
            isLoading: isBranchesLoading,
            status: isBranch
              ? currentBranch?.status === 'FUNCTIONS_DEPLOYED'
                ? ('ACTIVE_HEALTHY' as const)
                : currentBranch?.status === 'FUNCTIONS_FAILED' ||
                    currentBranch?.status === 'MIGRATIONS_FAILED'
                  ? ('UNHEALTHY' as const)
                  : ('COMING_UP' as const)
              : isMigrationLoading
                ? 'COMING_UP'
                : 'ACTIVE_HEALTHY',
            logsUrl: isBranch ? '/branches' : '/logs/database-logs',
          },
        ]
      : []),
  ]

  const isLoadingChecks = services.some((service) => service.isLoading)
  const allServicesOperational = services.every(
    (service) => service.status === 'ACTIVE_HEALTHY' || service.status === 'DISABLED'
  )

  const isProjectNew =
    (project?.inserted_at != null &&
      dayjs.utc().diff(dayjs.utc(project.inserted_at), 'minute') <
        SERVICE_STATUS_THRESHOLD_MINUTES) ||
    project?.status === 'COMING_UP' ||
    (isBranch &&
      (currentBranch?.status === 'CREATING_PROJECT' ||
        currentBranch?.status === 'RUNNING_MIGRATIONS' ||
        isMigrationLoading))

  const isProjectComingUp = ['COMING_UP', 'UNKNOWN'].includes(project?.status ?? '')

  const anyUnhealthy = services.some((service) => service.status === 'UNHEALTHY')
  const anyComingUp =
    isProjectComingUp || services.some((service) => service.status === 'COMING_UP')

  const getOverallStatusLabel = (): string => {
    if (isLoadingChecks) return 'Checking...'
    if (anyComingUp) return 'Coming up...'
    if (anyUnhealthy) return 'Unhealthy'
    return 'Healthy'
  }

  return {
    services,
    isLoadingChecks,
    allServicesOperational,
    isProjectNew,
    isProjectComingUp,
    overallStatusLabel: getOverallStatusLabel(),
  }
}
