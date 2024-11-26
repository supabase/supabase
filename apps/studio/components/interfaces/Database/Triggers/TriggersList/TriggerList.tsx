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
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import { useDatabaseTriggersQuery } from 'data/database-triggers/database-triggers-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Check, X, MoreVertical, Edit3, Trash, Edit, Edit2 } from 'lucide-react'
import { useAppStateSnapshot } from 'state/app-state'
import { useIsAssistantV2Enabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { cn } from 'ui'
import { generateTriggerCreateSQL } from './TriggerList.utils'

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
  const { setAiAssistantPanel } = useAppStateSnapshot()
  const isAssistantV2Enabled = useIsAssistantV2Enabled()

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
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ className="cursor-default truncate max-w-48 inline-block">
                {x.name}
              </TooltipTrigger_Shadcn_>
              <TooltipContent_Shadcn_ side="bottom" align="center">
                {x.name}
              </TooltipContent_Shadcn_>
            </Tooltip_Shadcn_>
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
                      <Button type="default" className="px-1" icon={<MoreVertical />} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      side="bottom"
                      align="end"
                      className={cn(isAssistantV2Enabled ? 'w-52' : 'w-36')}
                    >
                      <DropdownMenuItem className="space-x-2" onClick={() => editTrigger(x)}>
                        <Edit2 size={14} />
                        <p>Edit trigger</p>
                      </DropdownMenuItem>
                      {isAssistantV2Enabled && (
                        <DropdownMenuItem
                          className="space-x-2"
                          onClick={() => {
                            const sql = generateTriggerCreateSQL(x)
                            setAiAssistantPanel({
                              open: true,
                              initialInput: `Update this trigger which exists on the ${x.schema}.${x.table} table to...`,
                              suggestions: {
                                title:
                                  'I can help you make a change to this trigger, here are a few example prompts to get you started:',
                                prompts: [
                                  'Rename this trigger to ...',
                                  'Change the events this trigger responds to ...',
                                  'Modify this trigger to run after instead of before ...',
                                ],
                              },
                              sqlSnippets: [sql],
                            })
                          }}
                        >
                          <Edit size={14} />
                          <p>Edit with Assistant</p>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="space-x-2" onClick={() => deleteTrigger(x)}>
                        <Trash stroke="red" size={14} />
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
