import dayjs from 'dayjs'
import { AlertTriangle, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { PopoverSeparator } from '@ui/components/shadcn/ui/popover'
import { useParams } from 'common'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useEdgeFunctionServiceStatusQuery } from 'data/service-status/edge-functions-status-query'
import {
  ProjectServiceStatus,
  useProjectServiceStatusQuery,
} from 'data/service-status/service-status-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import {
  Button,
  InfoIcon,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

const SERVICE_STATUS_THRESHOLD = 5 // minutes

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
  if (isHealthy) return 'Healthy'
  if (isLoading) return 'Checking status'
  if (status === 'UNHEALTHY') return 'Unhealthy'
  if (status === 'COMING_UP') return 'Coming up...'
  if (status === 'ACTIVE_HEALTHY') return 'Healthy'
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
  if (isHealthy) return <CheckIcon />
  if (isLoading) return <LoaderIcon />
  if (projectStatus === 'UNHEALTHY') return <AlertIcon />
  if (projectStatus === 'COMING_UP') return <LoaderIcon />
  if (projectStatus === 'ACTIVE_HEALTHY') return <CheckIcon />
  if (isProjectNew) return <LoaderIcon />
  return <AlertIcon />
}

export const ServiceStatus = () => {
  const { ref } = useParams()
  const project = useSelectedProject()
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
  const { data: branches, isLoading: isBranchesLoading } = useBranchesQuery(
    { projectRef: isBranch ? project?.parentRef : undefined },
    {
      enabled: isBranch,
      refetchInterval: (data) => {
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
    isLoading,
    refetch: refetchServiceStatus,
  } = useProjectServiceStatusQuery(
    {
      projectRef: ref,
    },
    {
      refetchInterval: (data) => (data?.some((service) => !service.healthy) ? 5000 : false),
    }
  )
  const { data: edgeFunctionsStatus, refetch: refetchEdgeFunctionServiceStatus } =
    useEdgeFunctionServiceStatusQuery(
      {
        projectRef: ref,
      },
      {
        refetchInterval: (data) => (!data?.healthy ? 5000 : false),
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
            docsUrl: 'https://supabase.com/docs/guides/functions/troubleshooting',
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
            isHealthy: currentBranch?.status === 'FUNCTIONS_DEPLOYED',
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
  const allServicesOperational = services.every((service) => service.isHealthy)

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
    <Popover_Shadcn_ modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
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
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ portal className="p-0 w-56" side="bottom" align="center">
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
        {allServicesOperational ? null : (
          <>
            <PopoverSeparator />
            <div className="flex gap-2 text-xs text-foreground-light px-3 py-2">
              <div className="mt-0.5">
                <InfoIcon />
              </div>
              Recently restored projects can take up to 5 minutes to become fully operational.
            </div>
          </>
        )}
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
