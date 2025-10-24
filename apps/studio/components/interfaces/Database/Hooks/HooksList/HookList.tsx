import { PostgresTrigger } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { includes, noop } from 'lodash'
import { Edit3, MoreVertical, Trash } from 'lucide-react'
import Image from 'next/legacy/image'

import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useDatabaseHooksQuery } from 'data/database-triggers/database-triggers-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
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

export interface HookListProps {
  schema: string
  filterString: string
  editHook: (hook: PostgresTrigger) => void
  deleteHook: (hook: PostgresTrigger) => void
}

export const HookList = ({
  schema,
  filterString,
  editHook = noop,
  deleteHook = noop,
}: HookListProps) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: hooks } = useDatabaseHooksQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const restUrl = project?.restUrl
  const restUrlTld = restUrl ? new URL(restUrl).hostname.split('.').pop() : 'co'

  const filteredHooks = (hooks ?? []).filter(
    (x) =>
      includes(x.name.toLowerCase(), filterString.toLowerCase()) &&
      x.schema === schema &&
      x.function_args.length >= 2
  )
  const { can: canUpdateWebhook } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'triggers'
  )

  return (
    <>
      {filteredHooks.map((x) => {
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
                  <ButtonTooltip
                    disabled
                    type="default"
                    className="px-1"
                    icon={<MoreVertical />}
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: 'You need additional permissions to update webhooks',
                      },
                    }}
                  />
                )}
              </div>
            </Table.td>
          </Table.tr>
        )
      })}
    </>
  )
}
