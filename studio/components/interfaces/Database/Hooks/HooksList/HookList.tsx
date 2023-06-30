import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { includes, noop } from 'lodash'
import Image from 'next/image'

import { useParams } from 'common/hooks'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import { useDatabaseHooks } from 'data/database-triggers/database-triggers-query'
import { useCheckPermissions } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import { Badge, Button, Dropdown, IconEdit3, IconMoreVertical, IconTrash } from 'ui'

export interface HookListProps {
  schema: string
  filterString: string
  editHook: (hook: any) => void
  deleteHook: (hook: any) => void
}

const HookList = ({ schema, filterString, editHook = noop, deleteHook = noop }: HookListProps) => {
  const { ref } = useParams()
  const { project } = useProjectContext()
  const { data: hooks } = useDatabaseHooks({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const restUrl = project?.restUrl
  const restUrlTld = new URL(restUrl as string).hostname.split('.').pop()

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
          url.includes(`https://${ref}.functions.supabase.${restUrlTld}/`)
        const [url, method] = x.function_args

        return (
          <Table.tr key={x.id}>
            <Table.td>
              <div className="flex items-center space-x-4">
                <Image
                  src={
                    isEdgeFunction(url)
                      ? `${BASE_PATH}/img/function-providers/supabase-severless-function.png`
                      : `${BASE_PATH}/img/function-providers/http-request.png`
                  }
                  layout="fixed"
                  width="20"
                  height="20"
                  title={isEdgeFunction(url) ? 'Supabase Edge Function' : 'HTTP Request'}
                />
                <p title={x.name}>{x.name}</p>
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
                  <Dropdown
                    side="left"
                    overlay={
                      <>
                        <Dropdown.Item icon={<IconEdit3 size="tiny" />} onClick={() => editHook(x)}>
                          Edit hook
                        </Dropdown.Item>
                        <Dropdown.Item
                          icon={<IconTrash stroke="red" size="tiny" />}
                          onClick={() => deleteHook(x)}
                        >
                          Delete hook
                        </Dropdown.Item>
                      </>
                    }
                  >
                    <Button asChild type="default" icon={<IconMoreVertical />} className="px-1">
                      <span></span>
                    </Button>
                  </Dropdown>
                ) : (
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger asChild>
                      <Button disabled type="default" icon={<IconMoreVertical />} />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content side="left">
                        <Tooltip.Arrow className="radix-tooltip-arrow" />
                        <div
                          className={[
                            'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                            'border border-scale-200',
                          ].join(' ')}
                        >
                          <span className="text-xs text-scale-1200">
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
