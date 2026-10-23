import { useParams } from 'common'
import dayjs from 'dayjs'
import { ChevronDownIcon } from 'lucide-react'
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

import {
  DISMISS_REASON_LABELS,
  DISMISS_REASONS,
  SNOOZE_OPTIONS,
  STATUS_ICONS,
  STATUS_LABELS,
  STATUS_TEXT_CLASSES,
} from './Issues.constants'
import type { Issue, IssueUpdatePayload } from '@/data/issues/issue-schema'
import { useIssueUpdateMutation } from '@/data/issues/issue-update-mutation'

const useUpdateIssue = (issue: Issue) => {
  const { ref } = useParams()
  const { mutate, isPending } = useIssueUpdateMutation()

  const updateIssue = (payload: IssueUpdatePayload) => {
    if (!ref) return
    mutate({ projectRef: ref, id: issue.id, payload })
  }

  return { updateIssue, isPending }
}

const getStatusDetail = (issue: Issue) => {
  if (issue.status === 'dismissed' && issue.dismiss_reason) {
    return DISMISS_REASON_LABELS[issue.dismiss_reason]
  }
  if (issue.status === 'snoozed' && issue.snoozed_until) {
    return `until ${dayjs(issue.snoozed_until).format('D MMM')}`
  }
  return undefined
}

export const IssueStatusMenu = ({ issue }: { issue: Issue }) => {
  const { updateIssue, isPending } = useUpdateIssue(issue)
  const isOpen = issue.status === 'open'

  const StatusIcon = STATUS_ICONS[issue.status]
  const statusDetail = getStatusDetail(issue)
  const statusLabel = [STATUS_LABELS[issue.status], statusDetail].filter(Boolean).join(' ')

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        {/* Text button pulled left so its label lines up with the other property values */}
        <Button
          variant="text"
          size="tiny"
          className="-ml-2 h-7 min-w-0 max-w-full px-2 text-sm"
          aria-label={`Status: ${statusLabel}`}
          title={statusLabel}
          iconRight={<ChevronDownIcon size={14} className="text-foreground-lighter" />}
          loading={isPending}
          disabled={isPending}
        >
          <span className="flex min-w-0 items-center gap-2">
            <StatusIcon
              size={14}
              aria-hidden
              className={cn('shrink-0', STATUS_TEXT_CLASSES[issue.status])}
            />
            {STATUS_LABELS[issue.status]}
            {statusDetail && (
              <span className="truncate text-foreground-lighter">{statusDetail}</span>
            )}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {!isOpen && (
          <DropdownMenuItem onSelect={() => updateIssue({ status: 'open' })}>
            Reopen
          </DropdownMenuItem>
        )}
        {issue.status !== 'resolved' && (
          <DropdownMenuItem onSelect={() => updateIssue({ status: 'resolved' })}>
            Resolve
          </DropdownMenuItem>
        )}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Snooze</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-36">
            {SNOOZE_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.days}
                onSelect={() =>
                  updateIssue({
                    status: 'snoozed',
                    snoozed_until: dayjs().add(option.days, 'day').toISOString(),
                  })
                }
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Dismiss</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-40">
            {DISMISS_REASONS.map((reason) => (
              <DropdownMenuItem
                key={reason}
                onSelect={() => updateIssue({ status: 'dismissed', dismiss_reason: reason })}
              >
                {DISMISS_REASON_LABELS[reason]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
