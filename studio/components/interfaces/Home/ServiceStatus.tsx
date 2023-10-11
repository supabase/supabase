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
import { useSelectedProject } from 'hooks'

const ServiceStatus = () => {
  const { ref } = useParams()
  const project = useSelectedProject()
  const [open, setOpen] = useState(false)

  const isBranch = project?.parentRef !== project?.ref

  // Covers auth, storage, realtime, rest
  const { data: status, isLoading } = useProjectServiceStatusQuery({ projectRef: ref })

  // [Joshen] Need pooler service check eventually
  // [Joshen] Need edge functions check eventually
  const { isLoading: isLoadingPostgres, isSuccess: isSuccessPostgres } =
    usePostgresServiceStatusQuery({
      projectRef: ref,
      connectionString: project?.connectionString,
    })

  const authStatus = status?.find((service) => service.name === 'auth')
  const restStatus = status?.find((service) => service.name === 'rest')
  const realtimeStatus = status?.find((service) => service.name === 'realtime')
  const storageStatus = status?.find((service) => service.name === 'storage')

  const services = [
    {
      name: 'Database',
      isLoading: isLoadingPostgres,
      isSuccess: isSuccessPostgres,
    },
    { name: 'PostgREST', isLoading, isSuccess: restStatus?.healthy ?? false },
    { name: 'Auth', isLoading, isSuccess: authStatus?.healthy ?? false },
    { name: 'Realtime', isLoading, isSuccess: realtimeStatus?.healthy ?? false },
    { name: 'Storage', isLoading, isSuccess: storageStatus?.healthy ?? false },
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
      <PopoverContent_Shadcn_
        className="p-0 w-56"
        side="bottom"
        align="end"
        style={{ marginLeft: '-247px' }}
      >
        {services.map((service) => (
          <div
            key={service.name}
            className="px-4 py-2 text-xs flex items-center justify-between border-b"
          >
            <div>
              <p>{service.name}</p>
              <p className="text-light">
                {service.isLoading && 'Checking status'}
                {service.isSuccess ? 'No issues' : 'Unable to connect'}
              </p>
            </div>
            {service.isLoading && <IconLoader className="animate-spin" size="tiny" />}
            {service.isSuccess ? (
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
