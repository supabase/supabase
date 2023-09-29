import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { includes } from 'lodash'
import { observer } from 'mobx-react-lite'
import {
  Badge,
  Button,
  DropdownMenuContent_Shadcn_,
  DropdownMenuItem_Shadcn_,
  DropdownMenuTrigger_Shadcn_,
  DropdownMenu_Shadcn_,
  IconCheck,
  IconEdit3,
  IconMoreVertical,
  IconTrash,
  IconX,
} from 'ui'

import Table from 'components/to-be-cleaned/Table'
import { useCheckPermissions, useStore } from 'hooks'

interface TriggerListProps {
  schema: string
  filterString: string
  isLocked: boolean
  editTrigger: (trigger: any) => void
  deleteTrigger: (trigger: any) => void
}

const TriggerList = ({
  schema,
  filterString,
  isLocked,
  editTrigger,
  deleteTrigger,
}: TriggerListProps) => {
  const { meta } = useStore()
  const triggers = meta.triggers.list()
  const filteredTriggers = triggers.filter((x: any) =>
    includes(x.name.toLowerCase(), filterString.toLowerCase())
  )

  const _triggers = filteredTriggers.filter((x: any) => x.schema == schema)
  const canUpdateTriggers = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'triggers')

  if (_triggers.length === 0 && filterString.length === 0) {
    return (
      <Table.tr key={schema}>
        <Table.td colSpan={6}>
          <p className="text-sm text-foreground">No triggers created yet</p>
          <p className="text-sm text-light">There are no triggers found in the schema "{schema}"</p>
        </Table.td>
      </Table.tr>
    )
  }

  if (_triggers.length === 0 && filterString.length > 0) {
    return (
      <Table.tr key={schema}>
        <Table.td colSpan={5}>
          <p className="text-sm text-foreground">No results found</p>
          <p className="text-sm text-light">
            Your search for "{filterString}" did not return any results
          </p>
        </Table.td>
      </Table.tr>
    )
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
            <p title={x.table} className="truncate">
              {x.table}
            </p>
          </Table.td>

          <Table.td className="hidden space-x-2 xl:table-cell">
            <p title={x.function_name} className="truncate">
              {x.function_name}
            </p>
          </Table.td>

          <Table.td className="hidden xl:table-cell">
            <div className="flex space-x-2">
              {x.events.map((event: string) => (
                <Badge key={event}>{`${x.activation} ${event}`}</Badge>
              ))}
            </div>
          </Table.td>

          <Table.td className="hidden xl:table-cell">
            <div className="flex items-center justify-center">
              {x.enabled_mode !== 'DISABLED' ? (
                <IconCheck strokeWidth={2} className="text-brand" />
              ) : (
                <IconX strokeWidth={2} />
              )}
            </div>
          </Table.td>

          <Table.td className="text-right">
            {!isLocked && (
              <div className="flex items-center justify-end">
                {canUpdateTriggers ? (
                  <DropdownMenu_Shadcn_>
                    <DropdownMenuTrigger_Shadcn_>
                      <Button asChild type="default" icon={<IconMoreVertical />}>
                        <span></span>
                      </Button>
                    </DropdownMenuTrigger_Shadcn_>
                    <DropdownMenuContent_Shadcn_ side="bottom" align="end">
                      <>
                        <DropdownMenuItem_Shadcn_
                          className="space-x-2"
                          onClick={() => editTrigger(x)}
                        >
                          <IconEdit3 size="tiny" />
                          <p>Edit trigger</p>
                        </DropdownMenuItem_Shadcn_>
                        <DropdownMenuItem_Shadcn_
                          className="space-x-2"
                          onClick={() => deleteTrigger(x)}
                        >
                          <IconTrash stroke="red" size="tiny" />
                          <p>Delete trigger</p>
                        </DropdownMenuItem_Shadcn_>
                      </>
                    </DropdownMenuContent_Shadcn_>
                  </DropdownMenu_Shadcn_>
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
                          <span className="text-xs text-foreground">
                            You need additional permissions to update triggers
                          </span>
                        </div>
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                )}
              </div>
            )}
          </Table.td>
        </Table.tr>
      ))}
    </>
  )
}

export default observer(TriggerList)
