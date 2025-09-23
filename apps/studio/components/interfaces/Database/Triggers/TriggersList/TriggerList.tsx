import { PermissionAction } from '@supabase/shared-types/out/constants'
import { includes, sortBy } from 'lodash'
import { Check, Edit, Edit2, MoreVertical, Trash, X } from 'lucide-react'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useDatabaseTriggersQuery } from 'data/database-triggers/database-triggers-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
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
  const { data: project } = useSelectedProjectQuery()
  const aiSnap = useAiAssistantStateSnapshot()

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
  const { can: canUpdateTriggers } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'triggers'
  )

  if (_triggers.length === 0 && filterString.length === 0) {
    return (
      <TableRow key={schema}>
        <TableCell colSpan={7}>
          <p className="text-sm text-foreground">No triggers created yet</p>
          <p className="text-sm text-foreground-light">
            There are no triggers found in the schema "{schema}"
          </p>
        </TableCell>
      </TableRow>
    )
  }

  if (_triggers.length === 0 && filterString.length > 0) {
    return (
      <TableRow key={schema}>
        <TableCell colSpan={7}>
          <p className="text-sm text-foreground">No results found</p>
          <p className="text-sm text-foreground-light">
            Your search for "{filterString}" did not return any results
          </p>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {_triggers.map((x: any) => (
        <TableRow key={x.id}>
          <TableCell className="space-x-2">
            <Tooltip>
              <TooltipTrigger
                onClick={() => editTrigger(x)}
                className="cursor-pointer text-foreground truncate max-w-48 inline-block"
              >
                {x.name}
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center">
                {x.name}
              </TooltipContent>
            </Tooltip>
          </TableCell>

          <TableCell className="break-all">
            <p title={x.table} className="truncate">
              {x.table}
            </p>
          </TableCell>

          <TableCell className="space-x-2">
            <p title={x.function_name} className="truncate">
              {x.function_name}
            </p>
          </TableCell>

          <TableCell>
            <div className="flex gap-2 flex-wrap">
              {x.events.map((event: string) => (
                <Badge key={event}>{`${x.activation} ${event}`}</Badge>
              ))}
            </div>
          </TableCell>

          <TableCell className="space-x-2">
            <p title={x.orientation} className="truncate">
              {x.orientation}
            </p>
          </TableCell>

          <TableCell>
            <div className="flex items-center justify-center">
              {x.enabled_mode !== 'DISABLED' ? (
                <Check strokeWidth={2} className="text-brand" />
              ) : (
                <X strokeWidth={2} />
              )}
            </div>
          </TableCell>

          <TableCell className="text-right">
            {!isLocked && (
              <div className="flex items-center justify-end">
                {canUpdateTriggers ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-label="More options"
                        type="default"
                        className="px-1"
                        icon={<MoreVertical />}
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="end" className="w-52">
                      <DropdownMenuItem
                        className="space-x-2"
                        onClick={() => {
                          const sql = generateTriggerCreateSQL(x)
                          editTrigger(x)
                        }}
                      >
                        <Edit2 size={14} />
                        <p>Edit trigger</p>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="space-x-2"
                        onClick={() => {
                          const sql = generateTriggerCreateSQL(x)
                          aiSnap.newChat({
                            name: `Update trigger ${X.name}`,
                            open: true,
                            initialInput: `Update this trigger which exists on the ${x.schema}.${x.table} table to...`,
                            suggestions: {
                              title:
                                'I can help you make a change to this trigger, here are a few example prompts to get you started:',
                              prompts: [
                                {
                                  label: 'Rename Trigger',
                                  description: 'Rename this trigger to ...',
                                },
                                {
                                  label: 'Change Events',
                                  description: 'Change the events this trigger responds to ...',
                                },
                                {
                                  label: 'Modify Timing',
                                  description:
                                    'Modify this trigger to run after instead of before ...',
                                },
                              ],
                            },
                            sqlSnippets: [sql],
                          })
                        }}
                      >
                        <Edit size={14} />
                        <p>Edit with Assistant</p>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="space-x-2" onClick={() => deleteTrigger(x)}>
                        <Trash stroke="red" size={14} />
                        <p>Delete trigger</p>
                      </DropdownMenuItem>
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
                        text: 'You need additional permissions to update triggers',
                      },
                    }}
                  />
                )}
              </div>
            )}
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

export default TriggerList
