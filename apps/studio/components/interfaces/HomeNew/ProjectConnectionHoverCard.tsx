import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Label } from '@ui/components/shadcn/ui/label'
import { getConnectionStrings } from 'components/interfaces/Connect/DatabaseSettings.utils'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { pluckObjectFields } from 'lib/helpers'
import { Plug } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { type ReactNode, useMemo, useState } from 'react'
import { Button, HoverCard, HoverCardContent, HoverCardTrigger } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user'] as const
const EMPTY_CONNECTION_INFO = {
  db_user: '',
  db_host: '',
  db_port: '',
  db_name: '',
}

const DetailRow = ({ label, children }: { label: string; children: ReactNode }) => {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

interface ProjectConnectionHoverCardProps {
  projectRef?: string
}

export const ProjectConnectionHoverCard = ({ projectRef }: ProjectConnectionHoverCardProps) => {
  const [open, setOpen] = useState(false)
  const [_, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))

  const { data: settings, isPending: isLoadingSettings } = useProjectSettingsV2Query(
    { projectRef },
    { enabled: !!projectRef }
  )

  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint
  const projectUrl = endpoint ? `${protocol}://${endpoint}` : undefined

  const { isLoading: isLoadingPermissions, can: canReadAPIKeys } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'service_api_keys'
  )

  const { data: apiKeys, isLoading: isLoadingKeys } = useAPIKeysQuery(
    { projectRef },
    { enabled: open && canReadAPIKeys }
  )

  const { publishableKey } = canReadAPIKeys ? getKeys(apiKeys) : { publishableKey: null }

  const { data: databases, isLoading: isLoadingDatabases } = useReadReplicasQuery(
    { projectRef },
    { enabled: open && !!projectRef }
  )

  const primaryDatabase = databases?.find((db) => db.identifier === projectRef)

  const directConnectionString = useMemo(() => {
    if (
      !primaryDatabase?.db_host ||
      !primaryDatabase?.db_name ||
      !primaryDatabase?.db_user ||
      !primaryDatabase?.db_port
    ) {
      return ''
    }
    const connectionInfo = pluckObjectFields(primaryDatabase, [...DB_FIELDS])
    return getConnectionStrings({
      connectionInfo: { ...EMPTY_CONNECTION_INFO, ...connectionInfo },
      metadata: { projectRef },
    }).direct.uri
  }, [primaryDatabase, projectRef])

  const projectUrlLabel =
    projectUrl ?? (isLoadingSettings ? 'Loading project URL...' : 'Project URL unavailable')

  return (
    <HoverCard openDelay={250} closeDelay={100} open={open} onOpenChange={setOpen}>
      <HoverCardTrigger asChild>
        <button onClick={() => setShowConnect(true)} className="flex items-center gap-4 mt-3 group">
          <div className=" transition w-8 h-8 rounded-md bg-surface-75 group-hover:bg-muted border flex items-center justify-center">
            <Plug strokeWidth={1.5} size={16} className="text-foreground-light rotate-90" />
          </div>
          <span className="transition text-foreground-light group-hover:text-foreground underline decoration-dotted decoration-foreground-muted underline-offset-4 max-w-[320px] text-left">
            {projectUrlLabel}
          </span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="bottom" align="start" className="w-[420px] p-0">
        <div className="p-4 border-b space-y-4">
          <h3 className="heading-meta text-foreground-light">Data API</h3>
          <DetailRow label="Project URL">
            <Input
              copy
              readOnly
              className="font-mono text-xs"
              value={projectUrl ?? ''}
              placeholder="Project URL unavailable"
            />
          </DetailRow>
          <DetailRow label="Publishable Key">
            {isLoadingPermissions || isLoadingKeys ? (
              <div className="text-xs text-foreground-lighter">Loading publishable key...</div>
            ) : canReadAPIKeys ? (
              <Input
                copy
                readOnly
                className="font-mono text-xs"
                value={publishableKey?.api_key ?? ''}
                placeholder="Publishable key unavailable"
              />
            ) : (
              <div className="text-xs text-foreground-lighter">
                You don't have permission to view API keys.
              </div>
            )}
          </DetailRow>
        </div>
        <div className="p-4 space-y-4 border-b">
          <h3 className="heading-meta text-foreground-light"> Database </h3>
          <DetailRow label="Direct connection string">
            {isLoadingDatabases ? (
              <div className="text-xs text-foreground-lighter">Loading connection string...</div>
            ) : (
              <Input
                copy
                readOnly
                className="font-mono text-xs"
                value={directConnectionString}
                placeholder="Connection string unavailable"
              />
            )}
          </DetailRow>
        </div>
        <div className="p-4">
          <Button
            icon={<Plug className="rotate-90" />}
            type="default"
            size="medium"
            className="w-full"
            onClick={() => setShowConnect(true)}
          >
            Get connected
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
