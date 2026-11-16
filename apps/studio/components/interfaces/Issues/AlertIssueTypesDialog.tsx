import { useQuery } from '@tanstack/react-query'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Switch,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { CATEGORY_LABELS, ISSUE_CATEGORIES } from './Issues.constants'
import { AlertError } from '@/components/ui/AlertError'
import { useAlertIssueTypeDeleteMutation } from '@/data/alert-issues/alert-issue-type-delete-mutation'
import { useAlertIssueTypeSilenceMutation } from '@/data/alert-issues/alert-issue-type-silence-mutation'
import { alertIssueTypesQueryOptions } from '@/data/alert-issues/alert-issue-types-query'
import type { AlertIssueType } from '@/data/alert-issues/alert-issue.schema'
import type { IssueCategory } from '@/data/issues/issue.types'

const groupByCategory = (types: AlertIssueType[]) =>
  ISSUE_CATEGORIES.map((category) => ({
    category,
    types: types.filter((type) => type.category === category),
  })).filter((group) => group.types.length > 0)

type AlertIssueTypeRowProps = {
  type: AlertIssueType
  isUpdating: boolean
  onToggle: (type: AlertIssueType, enabled: boolean) => void
  onDelete: (type: AlertIssueType) => void
}

const AlertIssueTypeRow = ({ type, isUpdating, onToggle, onDelete }: AlertIssueTypeRowProps) => (
  <li className="flex items-start gap-3 py-2">
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground">{type.name}</span>
        {!type.managed && <Badge>Custom</Badge>}
        <span className="text-xs capitalize text-foreground-lighter">{type.severity}</span>
      </div>
      {type.description && <p className="text-xs text-foreground-lighter">{type.description}</p>}
      {type.lql && <code className="truncate text-xs text-foreground-lighter">{type.lql}</code>}
    </div>
    {!type.managed && (
      <Button
        variant="text"
        size="tiny"
        aria-label={`Delete ${type.name}`}
        icon={<Trash2Icon size={14} />}
        disabled={isUpdating}
        onClick={() => onDelete(type)}
      />
    )}
    <Switch
      aria-label={`Create ${type.name} alert issues`}
      checked={!type.silenced}
      disabled={isUpdating}
      onCheckedChange={(enabled) => onToggle(type, enabled)}
    />
  </li>
)

type AlertIssueTypesDialogProps = {
  projectRef: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateRule?: () => void
}

/** Turns alert issue types on or off for a project. Off adds a silence for the project. */
export const AlertIssueTypesDialog = ({
  projectRef,
  open,
  onOpenChange,
  onCreateRule,
}: AlertIssueTypesDialogProps) => {
  const { data, error, isPending, isError } = useQuery(alertIssueTypesQueryOptions({ projectRef }))
  const { mutate: setSilence, isPending: isToggling } = useAlertIssueTypeSilenceMutation()
  const { mutate: deleteRule, isPending: isDeleting } = useAlertIssueTypeDeleteMutation({
    onSuccess: () => toast.success('Log rule deleted'),
  })

  const handleToggle = (type: AlertIssueType, enabled: boolean) =>
    setSilence({ projectRef, ruleKey: type.rule_key, enabled, silenceId: type.silence_id })

  const handleDelete = (type: AlertIssueType) => deleteRule({ projectRef, ruleKey: type.rule_key })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="large">
        <DialogHeader>
          <DialogTitle>Alert issue types</DialogTitle>
          <DialogDescription>
            Choose which alerts create alert issues for this project. Turned-off types are still
            recorded, but hidden from the inbox.
          </DialogDescription>
        </DialogHeader>
        <DialogSection className="max-h-[60vh] overflow-y-auto">
          {isPending ? (
            <GenericSkeletonLoader />
          ) : isError ? (
            <AlertError error={error} subject="Failed to retrieve alert issue types" />
          ) : data.length === 0 ? (
            <p className="text-sm text-foreground-lighter">No alert issue types yet</p>
          ) : (
            <div className="flex flex-col gap-4">
              {groupByCategory(data).map(({ category, types }) => (
                <div
                  key={category}
                  role="group"
                  aria-label={CATEGORY_LABELS[category as IssueCategory]}
                  className="flex flex-col"
                >
                  <h3 className="text-xs uppercase tracking-wide text-foreground-lighter">
                    {CATEGORY_LABELS[category as IssueCategory]}
                  </h3>
                  <ul className="divide-y divide-border">
                    {types.map((type) => (
                      <AlertIssueTypeRow
                        key={type.rule_key}
                        type={type}
                        isUpdating={isToggling || isDeleting}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </DialogSection>
        {onCreateRule && (
          <DialogFooter>
            <Button variant="default" icon={<PlusIcon size={14} />} onClick={onCreateRule}>
              New log rule
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
