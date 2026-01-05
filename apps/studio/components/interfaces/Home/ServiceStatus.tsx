import dayjs from 'dayjs'
import { AlertTriangle, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useEdgeFunctionServiceStatusQuery } from 'data/service-status/edge-functions-status-query'
import {
  ProjectServiceStatus as APIProjectServiceStatus,
  ServiceHealthResponse,
  useProjectServiceStatusQuery,
} from 'data/service-status/service-status-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { Button, InfoIcon, PopoverContent, PopoverTrigger, Popover, PopoverSeparator } from 'ui'

const SERVICE_STATUS_THRESHOLD = 5 // minutes

export type ProjectServiceStatus = APIProjectServiceStatus | 'DISABLED'

export const StatusMessage = ({
  status,
  isLoading,
  isProjectNew,
}: {
  isLoading: boolean
  isProjectNew: boolean
  status?: ProjectServiceStatus
}) => {
  if (isLoading) return 'Checking status'
  if (status === 'DISABLED') return 'Disabled'
  if (status === 'UNHEALTHY') return 'Unhealthy'
  if (status === 'COMING_UP') return 'Coming up...'
  if (status === 'ACTIVE_HEALTHY') return 'Healthy'
  // isProjectNew has to be after all other statuses
  if (isProjectNew) return 'Coming up...'
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

export const StatusIcon = ({
  isLoading,
  isProjectNew,
  projectStatus,
}: {
  isLoading: boolean
  isProjectNew: boolean
  projectStatus?: ProjectServiceStatus
}) => {
  //
  if (projectStatus === 'ACTIVE_HEALTHY') return <CheckIcon />
  if (projectStatus === 'DISABLED') return <AlertIcon />
  if (projectStatus === 'COMING_UP') return <LoaderIcon />
  if (isLoading) return <LoaderIcon />
  // isProjectNew has to be above UNHEALTHY because in the first few minutes, some services might be starting up and show as UNHEALTHY
  if (isProjectNew) return <LoaderIcon />
  if (projectStatus === 'UNHEALTHY') return <AlertIcon />
  return <AlertIcon />
}

/*
 * Extract the db_schema from the response.info object
 */
export const extractDbSchema = (response: ServiceHealthResponse | undefined) => {
  if (response?.info && 'db_schema' in response.info) {
    return response.info.db_schema
  }
  return undefined
}

export const ServiceStatus = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [open, setOpen] = useState(false)

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
      refetchInterval: (query) => {
        const data = query.state.data
        if (!data) return false
        const currentBranch = data.find((branch) => branch.project_ref === ref)
        return ['FUNCTIONS_DEPLOYED', 'MIGRATIONS_FAILED', 'FUNCTIONS_FAILED'].includes(
          currentBranch?.status || ''
        )
          ? false
          : 5000
      },
    }
  )

  const currentBranch = isBranch
    ? branches?.find((branch) => branch.project_ref === ref)
    : undefined

  // [Joshen] Need pooler service check eventually
  const {
    data: status,
    isPending: isLoading,
    refetch: refetchServiceStatus,
  } = useProjectServiceStatusQuery(
    {
      projectRef: ref,
    },
    {
      refetchInterval: (query) => {
        const data = query.state.data
        const isServiceUnhealthy = data?.some((service) => {
          // if the postgrest service has an empty schema, the user chose to turn off postgrest during project creation
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
  const { data: edgeFunctionsStatus, refetch: refetchEdgeFunctionServiceStatus } =
    useEdgeFunctionServiceStatusQuery(
      {
        projectRef: ref,
      },
      {
        refetchInterval: (query) => {
          const data = query.state.data
          return !data?.healthy ? 5000 : false
        },
      }
    )

  const authStatus = status?.find((service) => service.name === 'auth')
  const restStatus = status?.find((service) => service.name === 'rest')
  const realtimeStatus = status?.find((service) => service.name === 'realtime')
  const storageStatus = status?.find((service) => service.name === 'storage')
  const dbStatus = status?.find((service) => service.name === 'db')

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
            status: (currentBranch?.status === 'FUNCTIONS_DEPLOYED'
              ? 'ACTIVE_HEALTHY'
              : currentBranch?.status === 'FUNCTIONS_FAILED' ||
                  currentBranch?.status === 'MIGRATIONS_FAILED'
                ? 'UNHEALTHY'
                : 'COMING_UP') as ProjectServiceStatus,
            logsUrl: '/branches',
          },
        ]
      : []),
  ]

  const isMigrationLoading =
    isBranchesLoading ||
    currentBranch?.status === 'CREATING_PROJECT' ||
    currentBranch?.status === 'RUNNING_MIGRATIONS'
  const isLoadingChecks = services.some((service) => service.isLoading)
  // We consider a service operational if it's healthy or intentionally disabled
  const allServicesOperational = services.every(
    (service) => service.status === 'ACTIVE_HEALTHY' || service.status === 'DISABLED'
  )

  // If the project is less than 5 minutes old, and status is not operational, then it's likely the service is still starting up
  const isProjectNew =
    dayjs.utc().diff(dayjs.utc(project?.inserted_at), 'minute') < SERVICE_STATUS_THRESHOLD ||
    project?.status === 'COMING_UP'

  useEffect(() => {
    let timer: any

    if (isProjectNew) {
      const secondsSinceProjectCreated = dayjs
        .utc()
        .diff(dayjs.utc(project?.inserted_at), 'seconds')
      const remainingTimeTillNextCheck = SERVICE_STATUS_THRESHOLD * 60 - secondsSinceProjectCreated

      timer = setTimeout(() => {
        refetchServiceStatus()
        refetchEdgeFunctionServiceStatus()
      }, remainingTimeTillNextCheck * 1000)
    }

    return () => {
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProjectNew])

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="default"
          icon={
            isLoadingChecks || (!allServicesOperational && isProjectNew && isMigrationLoading) ? (
              <LoaderIcon />
            ) : (
              <div
                className={`w-2 h-2 rounded-full ${
                  allServicesOperational ? 'bg-brand' : 'bg-warning'
                }`}
              />
            )
          }
        >
          {isBranch ? 'Branch' : 'Project'} Status
        </Button>
      </PopoverTrigger>
      <PopoverContent portal className="p-0 w-56" side="bottom" align="center">
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
      </PopoverContent>
    </Popover>
  )
}
