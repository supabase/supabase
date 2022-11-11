import { FC } from 'react'
import { includes } from 'lodash'
import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Badge, Button, Dropdown, IconMoreVertical, IconTrash, IconEdit3 } from 'ui'

import { checkPermissions, useStore } from 'hooks'
import Table from 'components/to-be-cleaned/Table'

interface Props {
  schema: string
  filterString: string
  editHook: (hook: any) => void
  deleteHook: (hook: any) => void
}

const HookList: FC<Props> = ({
  schema,
  filterString,
  editHook = () => {},
  deleteHook = () => {},
}) => {
  const { meta } = useStore()
  const hooks = meta.hooks.list()
  const filteredHooks = hooks.filter((x: any) =>
    includes(x.name.toLowerCase(), filterString.toLowerCase())
  )
  const _hooks = filteredHooks.filter((x: any) => x.schema == schema)
  const canUpdateWebhook = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'triggers')

  function onEdit(trigger: any) {
    editHook(trigger)
  }

  function onDelete(trigger: any) {
    deleteHook(trigger)
  }

  return (
    <>
      {_hooks.map((x: any) => (
        <Table.tr key={x.id}>
          <Table.td className="space-x-2">
            <p>{x.name}</p>
          </Table.td>
          <Table.td className="hidden space-x-2 lg:table-cell">
            <p>{x.table}</p>
          </Table.td>
          <Table.td className="hidden xl:table-cell">
            <p>
              {x.events.map((event: string) => (
                <Badge key={event}>{event}</Badge>
              ))}
            </p>
          </Table.td>
          <Table.td className="hidden xl:table-cell">
            <p>
              <Badge>{x.function_args[0]}</Badge>
            </p>
          </Table.td>
          <Table.td className="text-right">
            <div className="flex justify-end gap-4">
              {canUpdateWebhook ? (
                <Dropdown
                  side="left"
                  overlay={
                    <>
                      <Dropdown.Item icon={<IconEdit3 size="tiny" />} onClick={() => onEdit(x)}>
                        Edit hook
                      </Dropdown.Item>
                      <Dropdown.Item
                        icon={<IconTrash stroke="red" size="tiny" />}
                        onClick={() => onDelete(x)}
                      >
                        Delete hook
                      </Dropdown.Item>
                    </>
                  }
                >
                  <Button as="span" type="default" icon={<IconMoreVertical />} />
                </Dropdown>
              ) : (
                <Tooltip.Root delayDuration={0}>
                  <Tooltip.Trigger>
                    <Button as="span" disabled type="default" icon={<IconMoreVertical />} />
                  </Tooltip.Trigger>
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
                </Tooltip.Root>
              )}
            </div>
          </Table.td>
        </Table.tr>
      ))}
    </>
  )
}

export default observer(HookList)
