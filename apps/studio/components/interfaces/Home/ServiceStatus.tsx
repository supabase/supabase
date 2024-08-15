import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { useParams } from 'common'
import { useEdgeFunctionServiceStatusQuery } from 'data/service-status/edge-functions-status-query'
import { usePostgresServiceStatusQuery } from 'data/service-status/postgres-service-status-query'
import { useProjectServiceStatusQuery } from 'data/service-status/service-status-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { Button, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_, Popover_Shadcn_ } from 'ui'

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
  const { data: status, isLoading } = useProjectServiceStatusQuery({ projectRef: ref })
  const { data: edgeFunctionsStatus } = useEdgeFunctionServiceStatusQuery({ projectRef: ref })
  const { isLoading: isLoadingPostgres, isSuccess: isSuccessPostgres } =
    usePostgresServiceStatusQuery({
      projectRef: ref,
      connectionString: project?.connectionString,
    })

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
  }[] = [
    {
      name: 'Database',
      error: undefined,
      docsUrl: undefined,
      isLoading: isLoadingPostgres,
      isSuccess: isSuccessPostgres,
    },
    {
      name: 'PostgREST',
      error: restStatus?.error,
      docsUrl: undefined,
      isLoading,
      isSuccess: restStatus?.healthy,
    },
    ...(authEnabled
      ? [
          {
            name: 'Auth',
            error: authStatus?.error,
            docsUrl: undefined,
            isLoading,
            isSuccess: authStatus?.healthy,
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
          },
        ]
      : []),
  ]

  const isLoadingChecks = services.some((service) => service.isLoading)
  const allServicesOperational = services.every((service) => service.isSuccess)

  return (
    <Popover_Shadcn_ modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="default"
          icon={
            isLoadingChecks ? (
              <Loader2 className="animate-spin" />
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
          <div
            key={service.name}
            className="px-4 py-2 text-xs flex items-center justify-between border-b last:border-none"
          >
            <div>
              <p>{service.name}</p>
              <p className="text-foreground-light">
                {service.isLoading
                  ? 'Checking status'
                  : service.isSuccess
                    ? 'No issues'
                    : 'Unable to connect'}
              </p>
            </div>
            {service.isLoading ? (
              <Loader2 className="animate-spin text-foreground-light" size={18} />
            ) : service.isSuccess ? (
              <CheckCircle2 className="text-brand" size={18} strokeWidth={1.5} />
            ) : (
              <AlertTriangle className="text-warning" size={18} strokeWidth={1.5} />
            )}
          </div>
        ))}
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default ServiceStatus
