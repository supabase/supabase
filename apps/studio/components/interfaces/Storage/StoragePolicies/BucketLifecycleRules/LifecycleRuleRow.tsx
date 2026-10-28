import { EditIcon, MoreVerticalIcon, PauseIcon, PlayIcon, TrashIcon } from 'lucide-react'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { describeRule, type LifecycleRuleStatus } from './BucketLifecycleRules.utils'
import { DropdownMenuItemTooltip } from '@/components/ui/DropdownMenuItemTooltip'
import type { BucketLifecycleRule } from '@/data/storage/bucket-lifecycle-query'

interface LifecycleRuleRowProps {
  rule: BucketLifecycleRule
  canEdit: boolean
  editDisabledReason?: string
  onEdit: () => void
  onToggleStatus: (status: LifecycleRuleStatus) => void
  onDelete: () => void
}

export const LifecycleRuleRow = ({
  rule,
  canEdit,
  editDisabledReason,
  onEdit,
  onToggleStatus,
  onDelete,
}: LifecycleRuleRowProps) => {
  const expiration = rule.noncurrent_version_expiration
  const isEnabled = rule.status === 'Enabled'
  const disabledTooltip = {
    content: { side: 'left' as const, text: canEdit ? undefined : editDisabledReason },
  }

  return (
    <TableRow>
      <TableCell className="truncate">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block truncate font-mono text-xs text-foreground">
              {rule.id ?? <span className="text-foreground-lighter">Not set</span>}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-80">
            {describeRule(rule)}
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell>
        <Badge variant={isEnabled ? 'success' : 'default'}>{rule.status}</Badge>
      </TableCell>
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild>
            <code className="text-xs">{JSON.stringify(rule.filter)}</code>
          </TooltipTrigger>
          <TooltipContent side="bottom">Applies to the whole bucket</TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell className="font-mono text-xs">
        {expiration?.noncurrent_days ?? (
          <span className="text-foreground-lighter">Unsupported action</span>
        )}
      </TableCell>
      <TableCell className="font-mono text-xs">
        {expiration?.newer_noncurrent_versions ?? (
          <span className="text-foreground-lighter">—</span>
        )}
      </TableCell>
      <TableCell className="text-right whitespace-nowrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="px-1.5"
              icon={<MoreVerticalIcon />}
              aria-label={`${rule.id ?? 'Lifecycle rule'} actions`}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="w-48">
            <DropdownMenuItemTooltip
              className="gap-x-2"
              disabled={!canEdit}
              onClick={onEdit}
              tooltip={disabledTooltip}
            >
              <EditIcon size={14} />
              <p>Edit rule</p>
            </DropdownMenuItemTooltip>
            <DropdownMenuItemTooltip
              className="gap-x-2"
              disabled={!canEdit}
              onClick={() => onToggleStatus(isEnabled ? 'Disabled' : 'Enabled')}
              tooltip={disabledTooltip}
            >
              {isEnabled ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
              <p>{isEnabled ? 'Disable rule' : 'Enable rule'}</p>
            </DropdownMenuItemTooltip>
            <DropdownMenuSeparator />
            <DropdownMenuItemTooltip
              className="gap-x-2"
              disabled={!canEdit}
              onClick={onDelete}
              tooltip={disabledTooltip}
            >
              <TrashIcon size={14} />
              <p>Delete rule</p>
            </DropdownMenuItemTooltip>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
