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
  isShared: boolean
}

export const WrapperRow = ({ wrapper, isShared }: WrapperRowProps) => {
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
  const canEdit = canManageWrappers && !isShared
  let editTooltip = 'Edit wrapper'
  if (!canManageWrappers) editTooltip = 'You need additional permissions to edit wrappers'
  else if (isShared) editTooltip = 'Shared wrappers cannot be edited in the dashboard'

  return (
    <TableRow>
      <TableCell className="gap-2 align-top py-3! min-w-80">
        {wrapper.name}
        <p className="text-sm text-foreground-light">
          Connection: <code className="text-code-inline">{wrapper.server_name}</code>
        </p>
        {isShared && (
          <p className="text-sm text-foreground-light">
            This wrapper is shared. To edit this connection, use <code>ALTER SERVER</code> on{' '}
            <code className="text-code-inline">{wrapper.server_name}</code> or{' '}
            <code>ALTER FOREIGN TABLE</code> in the{' '}
            <Link
              href={`/project/${ref}/sql/new?skip=true`}
              className="underline underline-offset-2"
            >
              SQL Editor
            </Link>
            .
            {encryptedMetadata.length > 0 && (
              <>
                {' '}
                Edit this server&apos;s credentials in{' '}
                <Link
                  href={`/project/${ref}/settings/vault/secrets`}
                  className="underline underline-offset-2"
                >
                  Vault
                </Link>
                . Changes to a secret used by other connections affect them too.
              </>
            )}
          </p>
        )}

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

      <TableCell className="space-y-2 p-4!">
        {_tables?.map((table) => {
          const target = table.table ?? table.object ?? table.src_key

          return (
            <div key={table.id} className="flex items-center">
              <Badge className="bg-surface-300 gap-2 font-mono text-[0.75rem] h-6 text-foreground rounded-r-none">
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

              <Link href={`/project/${ref}/editor/${table.id}`}>
                <Badge className="transition hover:bg-surface-300 px-2 rounded-l-none gap-1.5 h-6 font-mono text-[0.75rem] border-l-0">
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
            disabled={!canEdit}
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
