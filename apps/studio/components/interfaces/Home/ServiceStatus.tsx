import dayjs from 'dayjs'
import { AlertTriangle, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import { useEdgeFunctionServiceStatusQuery } from 'data/service-status/edge-functions-status-query'
import { usePostgresServiceStatusQuery } from 'data/service-status/postgres-service-status-query'
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
import { PopoverSeparator } from '@ui/components/shadcn/ui/popover'

const SERVICE_STATUS_THRESHOLD = 5 // minutes

const StatusMessage = ({
  status,
  isLoading,
  isSuccess,
  isProjectNew,
}: {
  isLoading: boolean
  isSuccess: boolean
  isProjectNew: boolean
  status?: ProjectServiceStatus
}) => {
  if (isLoading) return 'Checking status'
  if (status === 'UNHEALTHY') return 'Unhealthy'
  if (status === 'COMING_UP') return 'Coming up...'
  if (status === 'ACTIVE_HEALTHY') return 'Healthy'
  if (isProjectNew) return 'Coming up...'
  if (isSuccess) return 'Healthy'
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
  isSuccess,
  isProjectNew,
  projectStatus,
}: {
  isLoading: boolean
  isSuccess: boolean
  isProjectNew: boolean
  projectStatus?: ProjectServiceStatus
}) => {
  if (isLoading) return <LoaderIcon />
  if (projectStatus === 'UNHEALTHY') return <AlertIcon />
  if (projectStatus === 'COMING_UP') return <LoaderIcon />
  if (projectStatus === 'ACTIVE_HEALTHY') return <CheckIcon />
  if (isProjectNew) return <LoaderIcon />
  if (isSuccess) return <CheckIcon />
  return <AlertIcon />
}

const ServiceStatus = () => {
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
  const {
    isLoading: isLoadingPostgres,
    isSuccess: isSuccessPostgres,
    refetch: refetchPostgresServiceStatus,
  } = usePostgresServiceStatusQuery(
    {
      projectRef: ref,
      connectionString: project?.connectionString,
    },
    {
      refetchInterval: (data) => (data === null ? 5000 : false),
    }
  )

  const authStatus = status?.find((service) => service.name === 'auth')
  const restStatus = status?.find((service) => service.name === 'rest')
  const realtimeStatus = status?.find((service) => service.name === 'realtime')
  const storageStatus = status?.find((service) => service.name === 'storage')

  // [Joshen] Need individual troubleshooting docs for each service eventually for users to self serve
  const services: {
    name: string
    error?: string
    docsUrl?: string
    isLoading: boolean
    isSuccess?: boolean
    logsUrl: string
    status?: ProjectServiceStatus
  }[] = [
    {
      name: 'Database',
      error: undefined,
      docsUrl: undefined,
      isLoading: isLoadingPostgres,
      isSuccess: isSuccessPostgres,
      logsUrl: '/logs/postgres-logs',
    },
    {
      name: 'PostgREST',
      error: restStatus?.error,
      docsUrl: undefined,
      isLoading,
      isSuccess: restStatus?.healthy,
      status: restStatus?.status,
      logsUrl: '/logs/postgrest-logs',
    },
    ...(authEnabled
      ? [
          {
            name: 'Auth',
            error: authStatus?.error,
            docsUrl: undefined,
            isLoading,
            isSuccess: authStatus?.healthy,
            status: authStatus?.status,
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
            isSuccess: realtimeStatus?.healthy,
            status: realtimeStatus?.status,
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
            isSuccess: storageStatus?.healthy,
            status: storageStatus?.status,
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
            isSuccess: edgeFunctionsStatus?.healthy,
            logsUrl: '/logs/edge-functions-logs',
          },
        ]
      : []),
  ]

  const isLoadingChecks = services.some((service) => service.isLoading)
  const allServicesOperational = services.every((service) => service.isSuccess)

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
        refetchPostgresServiceStatus()
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
            isLoadingChecks || isProjectNew ? (
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
          {isBranch ? 'Preview Branch' : 'Project'} Status
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-56" side="bottom" align="center">
        {services.map((service) => (
          <Link
            href={`/project/${ref}${service.logsUrl}`}
            key={service.name}
            className="transition px-3 py-2 text-xs flex items-center justify-between border-b last:border-none group relative hover:bg-surface-300"
          >
            <div className="flex gap-x-2">
              <StatusIcon
                isLoading={service.isLoading}
                isSuccess={!!service.isSuccess}
                isProjectNew={isProjectNew}
                projectStatus={service.status}
              />
              <div className="flex-1">
                <p>{service.name}</p>
                <p className="text-foreground-light flex items-center gap-1">
                  <StatusMessage
                    isLoading={service.isLoading}
                    isSuccess={!!service.isSuccess}
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

export default ServiceStatus
