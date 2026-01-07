import { includes, sortBy } from 'lodash'
import { useMemo } from 'react'
import { Check, Copy, Edit, Edit2, MoreVertical, Trash, X } from 'lucide-react'
import Link from 'next/link'

import { useParams } from 'common'
import { SUPABASE_ROLES } from 'components/interfaces/Database/Roles/Roles.constants'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import type { DatabaseEventTrigger } from 'data/database-event-triggers/database-event-triggers-query'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from 'ui'

interface EventTriggerListProps {
  filterString: string
  eventTriggers: DatabaseEventTrigger[]
  ownerFilter: string[]
  canEdit: boolean
  onEditTrigger: (trigger: DatabaseEventTrigger) => void
  onEditTriggerWithAssistant: (trigger: DatabaseEventTrigger) => void
  onDuplicateTrigger: (trigger: DatabaseEventTrigger) => void
  onDeleteTrigger: (trigger: DatabaseEventTrigger) => void
}

const SYSTEM_OWNERS = new Set<string>(SUPABASE_ROLES)

export const EventTriggerList = ({
  filterString,
  eventTriggers,
  ownerFilter,
  canEdit,
  onEditTrigger,
  onEditTriggerWithAssistant,
  onDuplicateTrigger,
  onDeleteTrigger,
}: EventTriggerListProps) => {
  const { ref: projectRef } = useParams()

  const orderedTriggers = useMemo(() => {
    const searchValue = filterString.toLowerCase()
    const ownerFilterSet = new Set(ownerFilter)

    const filteredEventTriggers = eventTriggers.filter((trigger) => {
      const matchesOwner =
        ownerFilterSet.size === 0 ? true : trigger.owner ? ownerFilterSet.has(trigger.owner) : false

      return (
        matchesOwner &&
        (includes(trigger.name.toLowerCase(), searchValue) ||
          includes(trigger.event.toLowerCase(), searchValue) ||
          (trigger.function_name && includes(trigger.function_name.toLowerCase(), searchValue)))
      )
    })

    return sortBy(filteredEventTriggers, (trigger) => trigger.name.toLocaleLowerCase())
  }, [eventTriggers, ownerFilter, filterString])

  if (orderedTriggers.length === 0 && filterString.length === 0 && ownerFilter.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={6}>
          <p className="text-sm text-foreground">No event triggers created yet</p>
          <p className="text-sm text-foreground-light">
            There are no event triggers configured for this database
          </p>
        </TableCell>
      </TableRow>
    )
  }

  if (orderedTriggers.length === 0 && (filterString.length > 0 || ownerFilter.length > 0)) {
    return (
      <TableRow>
        <TableCell colSpan={6}>
          <p className="text-sm text-foreground">No results found</p>
          <p className="text-sm text-foreground-light">
            {filterString.length > 0
              ? `Your search for "${filterString}" did not return any results`
              : 'No event triggers match the current filters'}
          </p>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {orderedTriggers.map((trigger) => {
        const isSystemTrigger = trigger.owner ? SYSTEM_OWNERS.has(trigger.owner) : false
        const canEditTrigger = !isSystemTrigger && canEdit
        const disabledReason = !canEdit
          ? 'You need additional permissions to update event triggers'
          : 'System event triggers cannot be edited'

        return (
          <TableRow key={trigger.oid}>
            <TableCell className="space-x-2">
              {canEditTrigger ? (
                <Button
                  type="text"
                  onClick={() => onEditTrigger(trigger)}
                  title={trigger.name}
                  className="text-link-table-cell text-left text-sm disabled:opacity-90 disabled:no-underline min-w-0 p-0 hover:bg-transparent font-medium max-w-48 title"
                >
                  {trigger.name}
                </Button>
              ) : (
                <p title={trigger.name} className="truncate text-foreground text-sm font-medium">
                  {trigger.name}
                </p>
              )}
            </TableCell>

            <TableCell>
              <Badge>{trigger.event}</Badge>
            </TableCell>

            <TableCell className="space-x-2">
              {trigger.function_name ? (
                <Link
                  href={`/project/${projectRef}/database/functions?search=${trigger.function_name}&schema=${trigger.function_schema}`}
                  className="text-link-table-cell block max-w-40 text-foreground-light"
                >
                  {trigger.function_name}
                </Link>
              ) : (
                <p className="truncate text-foreground-light">-</p>
              )}
            </TableCell>

            <TableCell>
              {trigger.tags && trigger.tags.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {trigger.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              ) : (
                <p className="truncate text-foreground-light">-</p>
              )}
            </TableCell>

            <TableCell>
              <div className="flex items-center justify-center">
                {trigger.enabled_mode !== 'DISABLED' ? (
                  <Check strokeWidth={2} className="text-brand" />
                ) : (
                  <X strokeWidth={2} />
                )}
              </div>
            </TableCell>
            <TableCell className="text-right">
              {canEditTrigger ? (
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
                    <DropdownMenuItem className="space-x-2" onClick={() => onEditTrigger(trigger)}>
                      <Edit2 size={14} />
                      <p>Edit trigger</p>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="space-x-2"
                      onClick={() => onEditTriggerWithAssistant(trigger)}
                    >
                      <Edit size={14} />
                      <p>Edit with Assistant</p>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="space-x-2"
                      onClick={() => onDuplicateTrigger(trigger)}
                    >
                      <Copy size={14} />
                      <p>Duplicate trigger</p>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="space-x-2"
                      onClick={() => onDeleteTrigger(trigger)}
                    >
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
                      text: disabledReason,
                    },
                  }}
                />
              )}
            </TableCell>
          </TableRow>
        )
      })}
    </>
  )
}
