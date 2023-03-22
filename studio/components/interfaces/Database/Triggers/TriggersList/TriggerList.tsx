import { FC } from 'react'
import { includes } from 'lodash'
import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Badge, Button, Dropdown, IconMoreVertical, IconTrash, IconEdit3 } from 'ui'

import { useStore, checkPermissions } from 'hooks'
import Table from 'components/to-be-cleaned/Table'

interface Props {
  filterString: string
  schema: string
  editTrigger: (trigger: any) => void
  deleteTrigger: (trigger: any) => void
}

const TriggerList: FC<Props> = ({ filterString, schema, editTrigger, deleteTrigger }) => {
  const { meta } = useStore()
  const triggers = meta.triggers.list()
  const filteredTriggers = triggers.filter((x: any) =>
    includes(x.name.toLowerCase(), filterString.toLowerCase())
  )

  const _triggers = filteredTriggers.filter((x: any) => x.schema == schema)
  const canUpdateTriggers = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'triggers')

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
          <Table.td className="space-x-2 break-all">
            <p>{x.name}</p>
          </Table.td>
          <Table.td className="hidden lg:table-cell break-all">
            <p>{x.table}</p>
          </Table.td>
          <Table.td className="hidden space-x-2 xl:table-cell">
            <div className="flex flex-col">
              <p>{x.function_name}</p>
            </div>
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
                        You need additional permissions to update triggers
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

export default observer(TriggerList)
