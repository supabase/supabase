import { useParams } from 'common'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  IconLoader,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

import { usePostgresServiceStatusQuery } from 'data/service-status/postgres-service-status-query'
import { useProjectServiceStatusQuery } from 'data/service-status/service-status-query'
import { useIsFeatureEnabled, useSelectedProject } from 'hooks'
import { useEdgeFunctionServiceStatusQuery } from 'data/service-status/edge-functions-status-query'

const ServiceStatus = () => {
  const { ref } = useParams()
  const project = useSelectedProject()
  const [open, setOpen] = useState(false)

  const { projectAuthAll: authEnabled, projectEdgeFunctionAll: edgeFunctionsEnabled } =
    useIsFeatureEnabled(['project_auth:all', 'project_edge_function:all'])

  const isBranch = project?.parentRef !== project?.ref

  // [Joshen] Need pooler service check eventually
  const { data: status, isLoading } = useProjectServiceStatusQuery({ projectRef: ref })
  const { data: edgeFunctionsStatus, isLoading: isLoadingEdgeFunctions } =
    useEdgeFunctionServiceStatusQuery({ projectRef: ref })
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
  const services = [
    {
      name: 'Database',
      docsUrls: undefined,
      isLoading: isLoadingPostgres,
      isSuccess: isSuccessPostgres,
    },
    { name: 'PostgREST', docsUrls: undefined, isLoading, isSuccess: restStatus?.healthy },
    ...(authEnabled
      ? [{ name: 'Auth', docsUrls: undefined, isLoading, isSuccess: authStatus?.healthy }]
      : []),
    { name: 'Realtime', docsUrls: undefined, isLoading, isSuccess: realtimeStatus?.healthy },
    // { name: 'Storage', docsUrls: undefined, isLoading, isSuccess: storageStatus?.healthy },
    ...(edgeFunctionsEnabled
      ? [
          {
            name: 'Edge Functions',
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
              <IconLoader className="animate-spin" />
            ) : allServicesOperational ? (
              <div className="w-2 h-2 rounded-full bg-brand" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-amber-900" />
            )
          }
        >
          {isBranch ? 'Preview Branch' : 'Project'} Status
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-56" side="bottom" align="end">
        {services.map((service) => (
          <div
            key={service.name}
            className="px-4 py-2 text-xs flex items-center justify-between border-b"
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
              <IconLoader className="animate-spin" size="tiny" />
            ) : service.isSuccess ? (
              <CheckCircle2 className="text-brand" size={18} strokeWidth={1.5} />
            ) : (
              <AlertTriangle className="text-amber-900" size={18} strokeWidth={1.5} />
            )}
          </div>
        ))}
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default ServiceStatus
