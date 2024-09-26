import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { includes, sortBy } from 'lodash'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import { useDatabaseTriggersQuery } from 'data/database-triggers/database-triggers-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Check, X, MoreVertical, Edit3, Trash } from 'lucide-react'

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
  const { project } = useProjectContext()

  const { data: triggers } = useDatabaseTriggersQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const filteredTriggers = (triggers ?? []).filter((x) =>
    includes(x.name.toLowerCase(), filterString.toLowerCase())
  )

  const _triggers = sortBy(
    filteredTriggers.filter((x) => x.schema == schema),
    (trigger) => trigger.name.toLocaleLowerCase()
  )
  const canUpdateTriggers = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'triggers')

  if (_triggers.length === 0 && filterString.length === 0) {
    return (
      <Table.tr key={schema}>
        <Table.td colSpan={7}>
          <p className="text-sm text-foreground">No triggers created yet</p>
          <p className="text-sm text-foreground-light">
            There are no triggers found in the schema "{schema}"
          </p>
        </Table.td>
      </Table.tr>
    )
  }

  if (_triggers.length === 0 && filterString.length > 0) {
    return (
      <Table.tr key={schema}>
        <Table.td colSpan={7}>
          <p className="text-sm text-foreground">No results found</p>
          <p className="text-sm text-foreground-light">
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

          <Table.td className="break-all">
            <p title={x.table} className="truncate">
              {x.table}
            </p>
          </Table.td>

          <Table.td className="space-x-2">
            <p title={x.function_name} className="truncate">
              {x.function_name}
            </p>
          </Table.td>

          <Table.td>
            <div className="flex gap-2 flex-wrap">
              {x.events.map((event: string) => (
                <Badge key={event}>{`${x.activation} ${event}`}</Badge>
              ))}
            </div>
          </Table.td>

          <Table.td className="space-x-2">
            <p title={x.orientation} className="truncate">
              {x.orientation}
            </p>
          </Table.td>

          <Table.td>
            <div className="flex items-center justify-center">
              {x.enabled_mode !== 'DISABLED' ? (
                <Check strokeWidth={2} className="text-brand" />
              ) : (
                <X strokeWidth={2} />
              )}
            </div>
          </Table.td>

          <Table.td className="text-right">
            {!isLocked && (
              <div className="flex items-center justify-end">
                {canUpdateTriggers ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="default" className="px-1">
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="end" className="w-36">
                      <DropdownMenuItem className="space-x-2" onClick={() => editTrigger(x)}>
                        <Edit3 size="14" />
                        <p>Edit trigger</p>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="space-x-2" onClick={() => deleteTrigger(x)}>
                        <Trash stroke="red" size="14" />
                        <p>Delete trigger</p>
                      </DropdownMenuItem>
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

export default TriggerList
