import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { includes } from 'lodash'
import { observer } from 'mobx-react-lite'
import { Badge, Button, Dropdown, IconEdit3, IconMoreVertical, IconTrash } from 'ui'

import Table from 'components/to-be-cleaned/Table'
import { useCheckPermissions, useStore } from 'hooks'

interface TriggerListProps {
  filterString: string
  schema: string
  editTrigger: (trigger: any) => void
  deleteTrigger: (trigger: any) => void
}

const TriggerList = ({ filterString, schema, editTrigger, deleteTrigger }: TriggerListProps) => {
  const { meta } = useStore()
  const triggers = meta.triggers.list()
  const filteredTriggers = triggers.filter((x: any) =>
    includes(x.name.toLowerCase(), filterString.toLowerCase())
  )

  const _triggers = filteredTriggers.filter((x: any) => x.schema == schema)
  const canUpdateTriggers = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'triggers')

  function onEdit(trigger: any) {
    editTrigger(trigger)
  }

  function onDelete(trigger: any) {
    deleteTrigger(trigger)
  }

  return (
    <>
      {_triggers.map((x: any) => (
        <Table.tr key={x.id}>
          <Table.td className="space-x-2">
            <p title={x.name} className="truncate">
              {x.name}
            </p>
          </Table.td>
          <Table.td className="hidden lg:table-cell break-all">
            <p title={x.table}>{x.table}</p>
          </Table.td>
          <Table.td className="hidden space-x-2 xl:table-cell">
            <p title={x.function_name}>{x.function_name}</p>
          </Table.td>
          <Table.td className="hidden xl:table-cell">
            <div className="flex space-x-2">
              {x.events.map((event: string) => (
                <Badge key={event}>{`${x.activation} ${event}`}</Badge>
              ))}
            </div>
          </Table.td>
          <Table.td className="text-right">
            <div className="flex items-center justify-end">
              {canUpdateTriggers ? (
                <Dropdown
                  side="bottom"
                  align="end"
                  overlay={
                    <>
                      <Dropdown.Item icon={<IconEdit3 size="tiny" />} onClick={() => onEdit(x)}>
                        Edit trigger
                      </Dropdown.Item>
                      <Dropdown.Item
                        icon={<IconTrash stroke="red" size="tiny" />}
                        onClick={() => onDelete(x)}
                      >
                        Delete trigger
                      </Dropdown.Item>
                    </>
                  }
                >
                  <Button asChild type="default" icon={<IconMoreVertical />}>
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
                          You need additional permissions to update triggers
                        </span>
                      </div>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              )}
            </div>
          </Table.td>
        </Table.tr>
      ))}
    </>
  )
}

export default observer(TriggerList)
