import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { partition } from 'lodash'
import { ChevronRight, Edit, ExternalLink, Table2, Trash } from 'lucide-react'
import Link from 'next/link'
import { parseAsString, useQueryState } from 'nuqs'
import { Badge, TableCell, TableRow, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { INTEGRATIONS } from '../Landing/Integrations.constants'
import { convertKVStringArrayToJson, formatWrapperTables } from './Wrappers.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import type { FDW } from '@/data/fdw/fdws-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

interface WrapperRowProps {
  wrapper: FDW
}

export const WrapperRow = ({ wrapper }: WrapperRowProps) => {
  const { ref, id } = useParams()
  const { can: canManageWrappers } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'wrappers'
  )

  const [, setSelectedWrapperToEdit] = useQueryState('edit', parseAsString)
  const [, setSelectedWrapperToDelete] = useQueryState('delete', parseAsString)

  const integration = INTEGRATIONS.find((i) => i.id === id)

  if (!integration || integration.type !== 'wrapper') {
    return <p className="text-foreground-lighter text-sm">A wrapper with this ID does not exist</p>
  }

  const serverOptions = convertKVStringArrayToJson(wrapper.server_options ?? [])
  const [encryptedMetadata, visibleMetadata] = partition(
    integration?.meta?.server.options.filter((option) => !option.hidden),
    'secureEntry'
  )

  const _tables = formatWrapperTables(wrapper, integration?.meta)

  const editTooltip = canManageWrappers
    ? 'Edit wrapper'
    : 'You need additional permissions to edit wrappers'

  return (
    <TableRow>
      <TableCell className="gap-2 align-top py-3! min-w-80">
        <p className="text-sm">{wrapper.server_name}</p>
        {visibleMetadata.map((metadata) => (
          <div
            key={metadata.name}
            className="flex items-center space-x-2 text-sm text-foreground-light"
          >
            <span className="text-foreground-lighter text-nowrap">{metadata.label}:</span>
            <span className="truncate max-w-72" title={serverOptions[metadata.name]}>
              {serverOptions[metadata.name] ?? metadata.defaultValue}
            </span>
          </div>
        ))}
      </TableCell>

      <TableCell className="space-y-2 p-4!">
        {_tables?.map((table) => {
          const target =
            (table.table as string | undefined) ??
            (table.object as string | undefined) ??
            (table.src_key as string | undefined) ??
            table.table_name
          const tableId = table.id as string

          return (
            <div key={tableId} className="flex items-center">
              <Badge className="bg-surface-300 gap-2 font-mono text-xs tracking-tight h-6 text-foreground rounded-r-none">
                <div className="relative w-3 h-3 flex items-center justify-center">
                  {integration.icon({ className: 'p-0' })}
                </div>
                <Tooltip>
                  <TooltipTrigger className="truncate max-w-28">{target}</TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="max-w-64 whitespace-pre-wrap wrap-break-word"
                  >
                    {target}
                  </TooltipContent>
                </Tooltip>
                <ChevronRight size={12} strokeWidth={1.5} className="text-foreground-lighter/50" />
              </Badge>

              <Link href={`/project/${ref}/editor/${tableId}`}>
                <Badge className="transition hover:bg-surface-300 px-2 rounded-l-none gap-1.5 h-6 font-mono text-xs tracking-tight border-l-0">
                  <Table2 size={12} strokeWidth={1.5} className="text-foreground-lighter/50" />
                  <Tooltip>
                    <TooltipTrigger className="truncate max-w-28">
                      {table.schema}.{table.table_name}
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="max-w-64 whitespace-pre-wrap wrap-break-word"
                    >
                      {table.schema}.{table.table_name}
                    </TooltipContent>
                  </Tooltip>
                </Badge>
              </Link>
            </div>
          )
        })}
      </TableCell>
      <TableCell>
        {encryptedMetadata.map((metadata) => (
          <div key={metadata.name} className="flex items-center space-x-2 text-sm">
            <Link
              href={`/project/${ref}/settings/vault/secrets?search=${encodeURIComponent(
                serverOptions[metadata.name] ?? ''
              )}`}
              className="transition text-foreground-light hover:text-foreground flex items-center gap-x-2"
            >
              <span title={`View ${metadata.label} in Vault`}>{metadata.label}</span>
              <ExternalLink size={14} strokeWidth={1.5} />
            </Link>
          </div>
        ))}
      </TableCell>
      <TableCell className="flex-nowrap">
        <div className="flex items-center gap-x-2">
          <ButtonTooltip
            disabled={!canManageWrappers}
            icon={<Edit strokeWidth={1.5} />}
            className="px-1.5"
            onClick={() => setSelectedWrapperToEdit(wrapper.id.toString())}
            tooltip={{
              content: {
                side: 'bottom',
                text: editTooltip,
              },
            }}
          />
          <ButtonTooltip
            disabled={!canManageWrappers}
            icon={<Trash strokeWidth={1.5} />}
            className="px-1.5"
            onClick={() => setSelectedWrapperToDelete(wrapper.id.toString())}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canManageWrappers
                  ? 'You need additional permissions to delete wrappers'
                  : 'Delete connection',
              },
            }}
          />
        </div>
      </TableCell>
    </TableRow>
  )
}
