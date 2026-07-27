import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Check, ChevronDown, Copy, Database, KeyRound, Link2, Terminal } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  cn,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { getConnectionStrings } from '@/components/interfaces/Connect/DatabaseSettings.utils'
import { useAPIKeys } from '@/data/api-keys/api-keys-query'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { IS_PLATFORM } from '@/lib/constants'
import { pluckObjectFields } from '@/lib/helpers'

const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user'] as const
const EMPTY_CONNECTION_INFO = {
  db_user: '',
  db_host: '',
  db_port: '',
  db_name: '',
}

interface ProjectConnectionPopoverProps {
  projectRef?: string
}

export const ProjectConnectionPopover = ({ projectRef }: ProjectConnectionPopoverProps) => {
  const [open, setOpen] = useState(false)
  const [copiedItem, setCopiedItem] = useState<string | null>(null)
  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))

  const { isLoading: isLoadingPermissions, can: canReadAPIKeys } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'service_api_keys'
  )

  const { data: projectUrl, isPending: isLoadingApiUrl } = useProjectApiUrl({ projectRef })

  const { data, isLoading: isLoadingKeys } = useAPIKeys(
    { projectRef },
    { enabled: open && canReadAPIKeys }
  )
  const { publishableKey } = data ?? {}

  const { data: databases, isLoading: isLoadingDatabases } = useReadReplicasQuery(
    { projectRef },
    { enabled: IS_PLATFORM && open && !!projectRef }
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

  const cliCommands = useMemo(
    () =>
      [
        'supabase login',
        'supabase init',
        `supabase link --project-ref ${projectRef ?? 'PROJECT_REF_UNAVAILABLE'}`,
      ].join('\n'),
    [projectRef]
  )

  // Self-hosted projects may not have a publishable key configured. Rather
  // than show a permanently-disabled "Publishable key unavailable" row, hide
  // the entry entirely on !IS_PLATFORM when the key isn't available. Platform
  // behavior is unchanged.
  const showPublishableKey = IS_PLATFORM || !!publishableKey?.api_key

  const menuItems = useMemo(
    () => [
      {
        label: 'Project URL',
        value: projectUrl ?? '',
        displayValue: isLoadingApiUrl
          ? 'Loading project URL...'
          : (projectUrl ?? 'Project URL unavailable'),
        disabled: isLoadingApiUrl || !projectUrl,
        icon: Link2,
      },
      ...(showPublishableKey
        ? [
            {
              label: 'Publishable key',
              value: publishableKey?.api_key ?? '',
              displayValue:
                isLoadingPermissions || isLoadingKeys
                  ? 'Loading publishable key...'
                  : canReadAPIKeys
                    ? (publishableKey?.api_key ?? 'Publishable key unavailable')
                    : "You don't have permission to view API keys.",
              disabled:
                isLoadingPermissions ||
                isLoadingKeys ||
                !canReadAPIKeys ||
                !publishableKey?.api_key,
              icon: KeyRound,
            },
          ]
        : []),
      ...(IS_PLATFORM
        ? [
            {
              label: 'Direct connection string',
              value: directConnectionString,
              displayValue: isLoadingDatabases
                ? 'Loading connection string...'
                : directConnectionString || 'Connection string unavailable',
              disabled: isLoadingDatabases || !directConnectionString,
              icon: Database,
            },
            {
              label: 'CLI setup commands',
              value: cliCommands,
              displayValue: cliCommands.replace(/\n/g, ' - '),
              disabled: !projectRef,
              icon: Terminal,
            },
          ]
        : []),
    ],
    [
      canReadAPIKeys,
      cliCommands,
      directConnectionString,
      isLoadingApiUrl,
      isLoadingDatabases,
      isLoadingKeys,
      isLoadingPermissions,
      projectRef,
      projectUrl,
      publishableKey?.api_key,
      showPublishableKey,
    ]
  )

  useEffect(() => {
    if (!open) {
      setCopiedItem(null)
    }
  }, [open])

  return (
    <div className="mt-3 flex items-center gap-3">
      {isLoadingApiUrl ? (
        <ShimmeringLoader className="w-80" />
      ) : (
        <span className="min-w-0 max-w-[400px] truncate text-left text-foreground-light">
          {projectUrl ?? 'Project URL unavailable'}
        </span>
      )}

      {!isLoadingApiUrl && (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              size="tiny"
              variant="default"
              iconRight={
                <ChevronDown
                  size={14}
                  className={cn('transition-transform', open && 'rotate-180')}
                />
              }
            >
              Copy <span className="sr-only">project URL and API keys</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="center" className="w-80 p-1">
            {menuItems.map((item) => {
              const Icon = item.icon

              return (
                <DropdownMenuItem
                  key={item.label}
                  className="group relative items-center gap-3 pr-10"
                  disabled={item.disabled}
                  onSelect={(event) => {
                    event.preventDefault()
                    if (item.disabled) return

                    copyToClipboard(item.value)
                    setCopiedItem(item.label)
                  }}
                >
                  <Icon size={14} className="mt-0.5 shrink-0 text-foreground-light" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-foreground">
                      {copiedItem !== item.label ? <span className="sr-only">Copy</span> : null}
                      {item.label}
                      {copiedItem === item.label ? (
                        <span className="sr-only">copied to your clipboard</span>
                      ) : null}
                    </div>
                    <div className="truncate text-sm text-foreground-lighter">
                      {item.displayValue}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'absolute right-2 top-1/2 -translate-y-1/2 text-foreground-lighter opacity-0 transition-opacity group-hover:opacity-100',
                      copiedItem === item.label && 'opacity-100 text-brand'
                    )}
                  >
                    {copiedItem === item.label ? <Check size={14} /> : <Copy size={14} />}
                  </div>
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
            <div className="p-1">
              <Button
                variant="default"
                size="tiny"
                className="w-full"
                onClick={() => {
                  setOpen(false)
                  setShowConnect(true)
                }}
              >
                Get Connected
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
