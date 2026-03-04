import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { SingleStat } from 'components/ui/SingleStat'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useEdgeFunctionServiceStatusQuery } from 'data/service-status/edge-functions-status-query'
import { useProjectServiceStatusQuery } from 'data/service-status/service-status-query'
import dayjs from 'dayjs'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { cn, InfoIcon, Popover_Shadcn_, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_ } from 'ui'

import {
  extractDbSchema,
  ProjectServiceStatus,
  StatusIcon,
  StatusMessage,
} from '../Home/ServiceStatus'

const SERVICE_STATUS_THRESHOLD = 5 // minutes

/**
 * [Joshen] JFYI before we go live with this, we need to revisit the migrations section
 * as I don't think it should live in the ServiceStatus component since its not indicative
 * of a project's "service". ServiceStatus's intention is to be an ongoing health/status check.
 *
 * For context, migrations are meant to be indicative for only when creating branches or projects
 * with an initial SQL, so "healthy" migrations just means that migrations have all been successfully
 * ran. So it might be a matter of decoupling "ready" state vs "health checks"
 * [Edit] Now that migrations are only showing up if the project is a branch, i think its okay for now
 *
 * [Joshen] Another issue that requires investigation before we go live with the changes:
 * We've removed the isProjectNew check in this component which we had that logic cause new
 * projects would show unhealthy as the services are still starting up - but it causes a
 * perceived negative impression as new projects were showing unhealthy, hence the 5 minute
 * threshold check (we’d show “Coming up” instead of “unhealthy” if the project is within 5
 * minutes of when it was created). Might be related to decoupling "ready" state vs "health checks"
 */

export const ServiceStatus = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

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

  const isBranch = project?.parentRef !== project?.ref

  // Get branches data when on a branch
  const { data: branches, isPending: isBranchesLoading } = useBranchesQuery(
    { projectRef: isBranch ? project?.parentRef : undefined },
    {
      enabled: isBranch,
    }
  )

  const currentBranch = isBranch
    ? branches?.find((branch) => branch.project_ref === ref)
    : undefined

  // [Joshen] Need pooler service check eventually
  const { data: status, isPending: isLoading } = useProjectServiceStatusQuery(
    { projectRef: ref },
    {
      refetchInterval: (query) => {
        const data = query.state.data
        const isServiceUnhealthy = data?.some((service) => {
          // if the postgrest service has an empty schema, postgrest has been disabled
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
    { projectRef: ref },
    { refetchInterval: (query) => (!query.state.data?.healthy ? 5000 : false) }
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

  // [Joshen] Need individual troubleshooting docs for each service eventually for users to self serve
  const services: {
    name: string
    error?: string
    docsUrl?: string
    isLoading: boolean
    status: ProjectServiceStatus
    logsUrl: string
  }[] = [
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
      // If PostgREST has an empty schema, it means it's been disabled
      status: extractDbSchema(restStatus) === '' ? 'DISABLED' : restStatus?.status ?? 'UNHEALTHY',
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
  // We consider a service operational if it's healthy or intentionally disabled
  const allServicesOperational = services.every(
    (service) => service.status === 'ACTIVE_HEALTHY' || service.status === 'DISABLED'
  )

  // Check if project or branch is in a startup state
  const isProjectNew =
    dayjs.utc().diff(dayjs.utc(project?.inserted_at), 'minute') < SERVICE_STATUS_THRESHOLD ||
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

  const overallStatusLabel = getOverallStatusLabel()

  return (
    <Popover_Shadcn_>
      <PopoverTrigger_Shadcn_>
        <SingleStat
          icon={
            // Spinner only while the overall project is in COMING_UP; otherwise show 6-dot grid
            isProjectComingUp ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {services.map((service, index) => (
                  <div
                    key={`${service.name}-${index}`}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      service.isLoading ||
                        service.status === 'COMING_UP' ||
                        (isProjectNew && service.status !== 'ACTIVE_HEALTHY')
                        ? 'bg-foreground-lighter animate-pulse'
                        : service.status === 'ACTIVE_HEALTHY'
                          ? 'bg-brand'
                          : 'bg-selection'
                    )}
                  />
                ))}
              </div>
            )
          }
          label={<span>Status</span>}
          value={<span>{overallStatusLabel}</span>}
        />
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-60" side="bottom" align="start">
        {services.map((service) => (
          <Link
            href={`/project/${ref}${service.logsUrl}`}
            key={service.name}
            className="transition px-3 py-2 text-xs flex items-center justify-between border-b last:border-none group relative hover:bg-surface-300"
          >
            <div className="flex gap-x-2">
              <StatusIcon
                isLoading={service.isLoading}
                isProjectNew={isProjectNew}
                projectStatus={service.status}
              />
              <div className="flex-1">
                <p>{service.name}</p>
                <p className="text-foreground-light flex items-center gap-1">
                  <StatusMessage
                    isLoading={service.isLoading}
                    isProjectNew={isProjectNew}
                    status={
                      isProjectComingUp && service.status === 'UNHEALTHY'
                        ? 'COMING_UP'
                        : service.status
                    }
                  />
                </p>
              </div>
            </div>
            <div className="flex items-center gap-x-1 transition opacity-0 group-hover:opacity-100">
              <span className="text-xs text-foreground">View logs</span>
              <ChevronRight size={14} className="text-foreground" />
            </div>
          </Link>
        ))}
        {!allServicesOperational && (
          <div className="flex gap-2 text-xs text-foreground-light px-3 py-2">
            <div className="mt-0.5">
              <InfoIcon />
            </div>
            <div className="flex flex-col gap-y-1">
              <p>
                {isProjectNew ? 'New' : 'Recently restored'} projects can take up to{' '}
                {SERVICE_STATUS_THRESHOLD} minutes to become fully operational.
              </p>
              <p>
                If services stay unhealthy, refer to our{' '}
                <InlineLink
                  href={`${DOCS_URL}/guides/troubleshooting/project-status-reports-unhealthy-services`}
                >
                  docs
                </InlineLink>{' '}
                for more information.
              </p>
            </div>
          </div>
        )}
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
