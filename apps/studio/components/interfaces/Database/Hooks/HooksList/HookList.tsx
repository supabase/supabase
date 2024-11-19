import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { includes, noop } from 'lodash'
import Image from 'next/legacy/image'

import { useParams } from 'common/hooks'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import { useDatabaseHooksQuery } from 'data/database-triggers/database-triggers-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { BASE_PATH } from 'lib/constants'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import { MoreVertical, Edit3, Trash } from 'lucide-react'

export interface HookListProps {
  schema: string
  filterString: string
  editHook: (hook: any) => void
  deleteHook: (hook: any) => void
}

const HookList = ({ schema, filterString, editHook = noop, deleteHook = noop }: HookListProps) => {
  const { ref } = useParams()
  const { project } = useProjectContext()
  const { data: hooks } = useDatabaseHooksQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const restUrl = project?.restUrl
  const restUrlTld = restUrl ? new URL(restUrl).hostname.split('.').pop() : 'co'

  const filteredHooks = (hooks ?? []).filter(
    (x: any) =>
      includes(x.name.toLowerCase(), filterString.toLowerCase()) &&
      x.schema === schema &&
      x.function_args.length >= 2
  )
  const canUpdateWebhook = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'triggers')

  return (
    <>
      {filteredHooks.map((x: any) => {
        const isEdgeFunction = (url: string) =>
          url.includes(`https://${ref}.functions.supabase.${restUrlTld}/`) ||
          url.includes(`https://${ref}.supabase.${restUrlTld}/functions/`)
        const [url, method] = x.function_args

        return (
          <Table.tr key={x.id}>
            <Table.td>
              <div className="flex items-center space-x-4">
                <div>
                  <Image
                    src={
                      isEdgeFunction(url)
                        ? `${BASE_PATH}/img/function-providers/supabase-severless-function.png`
                        : `${BASE_PATH}/img/function-providers/http-request.png`
                    }
                    alt="hook-type"
                    layout="fixed"
                    width="20"
                    height="20"
                    title={isEdgeFunction(url) ? 'Supabase Edge Function' : 'HTTP Request'}
                  />
                </div>
                <p title={x.name} className="truncate">
                  {x.name}
                </p>
              </div>
            </Table.td>
            <Table.td className="hidden space-x-2 lg:table-cell">
              <p title={x.table}>{x.table}</p>
            </Table.td>
            <Table.td className="hidden space-x-1 xl:table-cell">
              {x.events.map((event: string) => (
                <Badge key={event}>{event}</Badge>
              ))}
            </Table.td>
            <Table.td className="hidden xl:table-cell">
              <p className="truncate" title={url}>
                <code className="font-mono text-xs">{method}</code>: {url}
              </p>
            </Table.td>
            <Table.td className="text-right">
              <div className="flex justify-end gap-4">
                {canUpdateWebhook ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="default" className="px-1" icon={<MoreVertical />} />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent side="left">
                      <>
                        <DropdownMenuItem className="space-x-2" onClick={() => editHook(x)}>
                          <Edit3 size="14" />
                          <p>Edit hook</p>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="space-x-2" onClick={() => deleteHook(x)}>
                          <Trash stroke="red" size="14" />
                          <p>Delete hook</p>
                        </DropdownMenuItem>
                      </>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger asChild>
                      <Button disabled type="default" icon={<MoreVertical />} />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content side="left">
                        <Tooltip.Arrow className="radix-tooltip-arrow" />
                        <div
                          className={[
                            'rounded bg-alternative py-1 px-2 leading-none shadow',
                            'border border-background',
                          ].join(' ')}
                        >
                          <span className="text-xs text-foreground">
                            You need additional permissions to update webhooks
                          </span>
                        </div>
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                )}
              </div>
            </Table.td>
          </Table.tr>
        )
      })}
    </>
  )
}

export default HookList
