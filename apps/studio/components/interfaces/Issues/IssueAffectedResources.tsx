import { useParams } from 'common'
import { BellIcon, BellOffIcon, MoreHorizontalIcon } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'ui'

import { DISMISS_REASON_LABELS, DISMISS_REASONS, RESOURCE_TYPE_ICONS } from './Issues.constants'
import {
  describeResourceMute,
  formatIssueValue,
  getOpenResources,
  getResourceLabel,
  sortAffected,
} from './Issues.utils'
import { useIssueAffectedResourceUpdateMutation } from '@/data/issues/issue-affected-resource-update-mutation'
import type {
  Issue,
  IssueAffectedResource,
  IssueAffectedResourceUpdatePayload,
} from '@/data/issues/issue-schema'

// Enough to see the shape of a long list without stretching the properties column
const COLLAPSED_ROW_COUNT = 5

const AffectedResourceMenu = ({
  issue,
  affected,
  label,
}: {
  issue: Issue
  affected: IssueAffectedResource
  label: string
}) => {
  const { ref } = useParams()
  const { mutate, isPending } = useIssueAffectedResourceUpdateMutation()

  const updateResource = (payload: IssueAffectedResourceUpdatePayload) => {
    if (!ref) return
    mutate({ projectRef: ref, id: issue.id, affectedId: affected.id, payload })
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        {/* Shows on hover or focus so a long list stays quiet, and always on touch screens */}
        <Button
          variant="text"
          size="tiny"
          className="-mr-1 size-6 shrink-0 px-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100"
          icon={<MoreHorizontalIcon />}
          aria-label={`Options for ${label}`}
          loading={isPending}
          disabled={isPending}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {affected.muted !== null && (
          <DropdownMenuItem className="gap-2" onSelect={() => updateResource({ muted: null })}>
            <BellIcon size={14} />
            Unmute
          </DropdownMenuItem>
        )}
        {affected.muted === null && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <BellOffIcon size={14} />
              Mute
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-40">
              {DISMISS_REASONS.map((reason) => (
                <DropdownMenuItem
                  key={reason}
                  onSelect={() => updateResource({ muted: { reason, until: null } })}
                >
                  {DISMISS_REASON_LABELS[reason]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const AffectedResourceRow = ({
  issue,
  affected,
}: {
  issue: Issue
  affected: IssueAffectedResource
}) => {
  const label = getResourceLabel(affected)
  const Icon = RESOURCE_TYPE_ICONS[affected.resource?.type ?? 'other']
  const value = formatIssueValue(affected.value, affected.unit)

  return (
    <li className="group flex h-6 min-w-0 items-center gap-2">
      <Icon size={14} aria-hidden className="shrink-0 text-foreground-lighter" />
      <span
        title={label}
        className={cn('min-w-0 flex-1 truncate', affected.muted && 'text-foreground-lighter')}
      >
        {label}
      </span>
      {value && <span className="shrink-0 tabular-nums text-foreground-light">{value}</span>}
      {affected.muted && (
        <span
          title={describeResourceMute(affected.muted)}
          className="flex shrink-0 text-foreground-lighter"
        >
          <BellOffIcon size={12} aria-hidden />
          <span className="sr-only">{describeResourceMute(affected.muted)}</span>
        </span>
      )}
      <AffectedResourceMenu issue={issue} affected={affected} label={label} />
    </li>
  )
}

/**
 * Every resource the issue is failing on right now, e.g. each public table without RLS, so
 * one that's fine as it is can be muted without dismissing the rest.
 */
export const IssueAffectedResources = ({ issue }: { issue: Issue }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const affected = sortAffected(getOpenResources(issue))
  if (affected.length === 0) return <span className="text-foreground-light">None</span>

  const visible = isExpanded ? affected : affected.slice(0, COLLAPSED_ROW_COUNT)
  const hiddenCount = affected.length - visible.length

  return (
    <div className="flex min-w-0 flex-1 flex-col items-start">
      <ul aria-label="Affected resources" className="flex w-full min-w-0 flex-col">
        {visible.map((item) => (
          <AffectedResourceRow key={item.id} issue={issue} affected={item} />
        ))}
      </ul>
      {hiddenCount > 0 && (
        <Button
          variant="text"
          size="tiny"
          className="-ml-2 px-2 text-foreground-lighter"
          onClick={() => setIsExpanded(true)}
        >
          Show {hiddenCount.toLocaleString()} more
        </Button>
      )}
    </div>
  )
}
