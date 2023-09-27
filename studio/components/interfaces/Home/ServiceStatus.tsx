import { useParams } from 'common'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Button,
  IconLoader,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

import { createClient } from '@supabase/supabase-js'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useAuthServiceStatusQuery } from 'data/service-status/auth-service-status-query'
import { usePostgresServiceStatusQuery } from 'data/service-status/postgres-service-status-query'
import { usePostgrestServiceStatusQuery } from 'data/service-status/postgrest-service-status-query'
import { useStorageServiceStatusQuery } from 'data/service-status/storage-service-status-query'
import { useSelectedProject } from 'hooks'

const ServiceStatus = () => {
  const { ref } = useParams()
  const project = useSelectedProject()
  const [open, setOpen] = useState(false)

  const isBranch = project?.parentRef !== project?.ref
  const { data } = useProjectApiQuery({ projectRef: ref })
  const { endpoint, defaultApiKey } = data?.autoApiService || {}

  // [Joshen] Realtime status will be handled separately
  const [realtimeStatus, setRealtimeStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const realtimeClient =
    endpoint && defaultApiKey ? createClient(`https://${endpoint}`, defaultApiKey) : undefined
  if (realtimeClient !== undefined) {
    const channel = realtimeClient.channel('health', { config: { broadcast: { self: true } } })
    channel.on('broadcast', { event: 'health-check' }, (payload) => {
      if (payload.event === 'health-check') {
        setRealtimeStatus('success')
        realtimeClient.removeChannel(channel)
      }
    })
    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') return
      channel.send({ type: 'broadcast', event: 'health-check', payload: {} })
    })
  }

  useEffect(() => {
    setTimeout(() => {
      if (realtimeStatus === 'loading') setRealtimeStatus('error')
    }, 5000)
  }, [])

  // [Joshen] Still need pooler service check eventually
  const {
    isLoading: isLoadingPostgres,
    isError: isErrorPostgres,
    isSuccess: isSuccessPostgres,
  } = usePostgresServiceStatusQuery({
    projectRef: ref,
    connectionString: project?.connectionString,
  })
  const {
    isLoading: isLoadingPostgrest,
    isError: isErrorPostgrest,
    isSuccess: isSuccessPostgrest,
  } = usePostgrestServiceStatusQuery({
    projectRef: ref,
  })
  const {
    isLoading: isLoadingStorage,
    isError: isErrorStorage,
    isSuccess: isSuccessStorage,
  } = useStorageServiceStatusQuery({
    projectRef: ref,
  })
  const {
    isLoading: isLoadingAuth,
    isError: isErrorAuth,
    isSuccess: isSuccessAuth,
  } = useAuthServiceStatusQuery(
    {
      projectRef: ref,
      endpoint: endpoint,
      anonKey: defaultApiKey,
    },
    { enabled: defaultApiKey !== undefined }
  )

  const services = [
    {
      name: 'Auth',
      isLoading: isLoadingAuth,
      isError: isErrorAuth,
      isSuccess: isSuccessAuth,
    },
    {
      name: 'Database',
      isLoading: isLoadingPostgres,
      isError: isErrorPostgres,
      isSuccess: isSuccessPostgres,
    },
    {
      name: 'PostgREST',
      isLoading: isLoadingPostgrest,
      isError: isErrorPostgrest,
      isSuccess: isSuccessPostgrest,
    },
    {
      name: 'Realtime',
      isLoading: realtimeStatus === 'loading',
      isError: realtimeStatus === 'error',
      isSuccess: realtimeStatus === 'success',
    },
    {
      name: 'Storage',
      isLoading: isLoadingStorage,
      isError: isErrorStorage,
      isSuccess: isSuccessStorage,
    },
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
        {services.map((service) => {
          if (['Auth', 'Realtime'].includes(service.name) && defaultApiKey === undefined) {
            return null
          }
          return (
            <div
              key={service.name}
              className="px-4 py-2 text-xs flex items-center justify-between border-b"
            >
              <div>
                <p>{service.name}</p>
                <p className="text-light">
                  {service.isLoading && 'Checking status'}
                  {service.isSuccess && 'No issues'}
                  {service.isError && 'Unable to connect'}
                </p>
              </div>
              {service.isLoading && <IconLoader className="animate-spin" size="tiny" />}
              {service.isSuccess && (
                <CheckCircle2 className="text-brand" size={18} strokeWidth={1.5} />
              )}
              {service.isError && (
                <AlertTriangle className="text-amber-900" size={18} strokeWidth={1.5} />
              )}
            </div>
          )
        })}
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default ServiceStatus
