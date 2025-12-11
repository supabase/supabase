import dayjs from 'dayjs'
import { AlertTriangle, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { SingleStat } from 'components/ui/SingleStat'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useEdgeFunctionServiceStatusQuery } from 'data/service-status/edge-functions-status-query'
import {
  ProjectServiceStatus,
  useProjectServiceStatusQuery,
} from 'data/service-status/service-status-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { InfoIcon, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_, Popover_Shadcn_, cn } from 'ui'

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

const StatusMessage = ({
  status,
  isLoading,
  isHealthy,
  isProjectNew,
}: {
  isLoading: boolean
  isHealthy: boolean
  isProjectNew: boolean
  status?: ProjectServiceStatus
}) => {
  if (isHealthy || status === 'ACTIVE_HEALTHY') return 'Healthy'
  if (isLoading) return 'Checking status'
  if (status === 'UNHEALTHY') return 'Unhealthy'
  if (isProjectNew || status === 'COMING_UP') return 'Coming up...'
  if (status) return status
  return 'Unable to connect'
}

const iconProps = {
  size: 18,
  strokeWidth: 1.5,
}
const LoaderIcon = () => <Loader2 {...iconProps} className="animate-spin" />
const AlertIcon = () => <AlertTriangle {...iconProps} />
const CheckIcon = () => <CheckCircle2 {...iconProps} className="text-brand" />

const StatusIcon = ({
  isLoading,
  isHealthy,
  isProjectNew,
  projectStatus,
}: {
  isLoading: boolean
  isHealthy: boolean
  isProjectNew: boolean
  projectStatus?: ProjectServiceStatus
}) => {
  if (isHealthy || projectStatus === 'ACTIVE_HEALTHY') return <CheckIcon />
  if (isLoading || isProjectNew || projectStatus === 'COMING_UP') return <LoaderIcon />
  return <AlertIcon />
}

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
      refetchInterval: (query) =>
        query.state.data?.some((service) => !service.healthy) ? 5000 : false,
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
    isHealthy: boolean
    status: ProjectServiceStatus
    logsUrl: string
  }[] = [
    {
      name: 'Database',
      error: undefined,
      docsUrl: undefined,
      isLoading: isLoading,
      isHealthy: !!dbStatus?.healthy,
      status: dbStatus?.status ?? 'UNHEALTHY',
      logsUrl: '/logs/postgres-logs',
    },
    {
      name: 'PostgREST',
      error: restStatus?.error,
      docsUrl: undefined,
      isLoading,
      isHealthy: !!restStatus?.healthy,
      status: restStatus?.status ?? 'UNHEALTHY',
      logsUrl: '/logs/postgrest-logs',
    },
    ...(authEnabled
      ? [
          {
            name: 'Auth',
            error: authStatus?.error,
            docsUrl: undefined,
            isLoading,
            isHealthy: !!authStatus?.healthy,
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
            isHealthy: !!realtimeStatus?.healthy,
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
            isHealthy: !!storageStatus?.healthy,
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
            isHealthy: !!edgeFunctionsStatus?.healthy,
            status: edgeFunctionsStatus?.healthy
              ? 'ACTIVE_HEALTHY'
              : isLoading
                ? 'COMING_UP'
                : ('UNHEALTHY' as ProjectServiceStatus),
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
            isHealthy: isBranch
              ? currentBranch?.status === 'FUNCTIONS_DEPLOYED'
              : !isMigrationLoading,
            status: (isBranch
              ? currentBranch?.status === 'FUNCTIONS_DEPLOYED'
                ? 'ACTIVE_HEALTHY'
                : currentBranch?.status === 'FUNCTIONS_FAILED' ||
                    currentBranch?.status === 'MIGRATIONS_FAILED'
                  ? 'UNHEALTHY'
                  : 'COMING_UP'
              : isMigrationLoading
                ? 'COMING_UP'
                : 'ACTIVE_HEALTHY') as ProjectServiceStatus,
            logsUrl: isBranch ? '/branches' : '/logs/database-logs',
          },
        ]
      : []),
  ]

  const isLoadingChecks = services.some((service) => service.isLoading)
  const allServicesOperational = services.every((service) => service.isHealthy)

  // Check if project or branch is in a startup state
  const isProjectNew =
    dayjs.utc().diff(dayjs.utc(project?.inserted_at), 'minute') < SERVICE_STATUS_THRESHOLD ||
    project?.status === 'COMING_UP' ||
    (isBranch &&
      (currentBranch?.status === 'CREATING_PROJECT' ||
        currentBranch?.status === 'RUNNING_MIGRATIONS' ||
        isMigrationLoading))

  const anyUnhealthy = services.some(
    (service) => !service.isHealthy && service.status !== 'COMING_UP'
  )
  const anyComingUp = services.some((service) => service.status === 'COMING_UP')
  // Spinner only while the overall project is in COMING_UP; otherwise show 6-dot grid
  const showSpinnerIcon = project?.status === 'COMING_UP'

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
            showSpinnerIcon ? (
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
                        (isProjectNew && !service.isHealthy)
                        ? 'bg-foreground-lighter animate-pulse'
                        : service.isHealthy
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
      <PopoverContent_Shadcn_ portal className="p-0 w-60" side="bottom" align="start">
        {services.map((service) => (
          <Link
            href={`/project/${ref}${service.logsUrl}`}
            key={service.name}
            className="transition px-3 py-2 text-xs flex items-center justify-between border-b last:border-none group relative hover:bg-surface-300"
          >
            <div className="flex gap-x-2">
              <StatusIcon
                isLoading={service.isLoading}
                isHealthy={!!service.isHealthy}
                isProjectNew={isProjectNew}
                projectStatus={service.status}
              />
              <div className="flex-1">
                <p>{service.name}</p>
                <p className="text-foreground-light flex items-center gap-1">
                  <StatusMessage
                    isLoading={service.isLoading}
                    isHealthy={!!service.isHealthy}
                    isProjectNew={isProjectNew}
                    status={service.status}
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
