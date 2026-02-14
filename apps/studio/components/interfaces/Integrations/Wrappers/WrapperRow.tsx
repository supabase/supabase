import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import type { FDW } from 'data/fdw/fdws-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { partition } from 'lodash'
import { ChevronRight, Edit, ExternalLink, Table2, Trash } from 'lucide-react'
import Link from 'next/link'
import { parseAsString, useQueryState } from 'nuqs'
import { Badge, TableCell, TableRow, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { INTEGRATIONS } from '../Landing/Integrations.constants'
import { convertKVStringArrayToJson, formatWrapperTables } from './Wrappers.utils'

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

  return (
    <TableRow>
      <TableCell className="gap-2 align-top !py-3 min-w-80">
        {wrapper.name}

        {visibleMetadata.map((metadata) => (
          <div
            key={metadata.name}
            className="flex items-center space-x-2 text-sm text-foreground-light"
          >
            <span className="text-foreground-lighter text-nowrap">{metadata.label}:</span>
            <span className="truncate max-w-72" title={serverOptions[metadata.name]}>
              {serverOptions[metadata.name]}
            </span>
          </div>
        ))}
      </TableCell>

      <TableCell className="space-y-2 !p-4">
        {_tables?.map((table) => {
          const target = table.table ?? table.object ?? table.src_key

          return (
            <div key={table.id} className="flex items-center">
              <Badge className="bg-surface-300 bg-opacity-100 gap-2 font-mono text-[0.75rem] h-6 text-foreground rounded-r-none">
                <div className="relative w-3 h-3 flex items-center justify-center">
                  {integration.icon({ className: 'p-0' })}
                </div>
                <Tooltip>
                  <TooltipTrigger className="truncate max-w-28">{target}</TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="max-w-64 whitespace-pre-wrap break-words"
                  >
                    {target}
                  </TooltipContent>
                </Tooltip>
                <ChevronRight size={12} strokeWidth={1.5} className="text-foreground-lighter/50" />
              </Badge>

              <Link href={`/project/${ref}/editor/${table.id}`}>
                <Badge className="transition hover:bg-surface-300 px-2 rounded-l-none gap-1.5 h-6 font-mono text-[0.75rem] border-l-0">
                  <Table2 size={12} strokeWidth={1.5} className="text-foreground-lighter/50" />
                  <Tooltip>
                    <TooltipTrigger className="truncate max-w-28">
                      {table.schema}.{table.table_name}
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="max-w-64 whitespace-pre-wrap break-words"
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
                `${wrapper.name}_${metadata.name}`
              )}`}
              className="transition text-foreground-light hover:text-foreground flex items-center space-x-2 max-w-28"
            >
              <span className="truncate" title={metadata.label}>
                {metadata.label}
              </span>
              <div>
                <ExternalLink size={12} strokeWidth={1.5} className="text-foreground-lighter" />
              </div>
            </Link>
          </div>
        ))}
      </TableCell>
      <TableCell className="flex-nowrap">
        <div className="flex items-center gap-x-2">
          <ButtonTooltip
            disabled={!canManageWrappers}
            type="default"
            icon={<Edit strokeWidth={1.5} />}
            className="px-1.5"
            onClick={() => setSelectedWrapperToEdit(wrapper.id.toString())}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canManageWrappers
                  ? 'You need additional permissions to edit wrappers'
                  : 'Edit wrapper',
              },
            }}
          />
          <ButtonTooltip
            type="default"
            disabled={!canManageWrappers}
            icon={<Trash strokeWidth={1.5} />}
            className="px-1.5"
            onClick={() => setSelectedWrapperToDelete(wrapper.id.toString())}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canManageWrappers
                  ? 'You need additional permissions to delete wrappers'
                  : 'Delete wrapper',
              },
            }}
          />
        </div>
      </TableCell>
    </TableRow>
  )
}
