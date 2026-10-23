import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { MoreHorizontalIcon, PencilIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Switch,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { IssueNotificationRuleDialog } from './IssueNotificationRuleDialog'
import { NOTIFICATION_DESTINATIONS, NOTIFICATION_SEVERITIES } from './IssueNotifications.constants'
import { formatNotificationRuleChecks } from './Issues.utils'
import { AlertError } from '@/components/ui/AlertError'
import { issueChecksQueryOptions } from '@/data/issues/issue-checks-query'
import { useIssueNotificationRuleMutation } from '@/data/issues/issue-notification-rule-mutation'
import { issueNotificationRulesQueryOptions } from '@/data/issues/issue-notification-rules-query'
import type { IssueNotificationRule } from '@/data/issues/issue-notification-schema'

export const IssueNotificationSettings = () => {
  const { ref } = useParams()
  const [editingRule, setEditingRule] = useState<IssueNotificationRule | 'new'>()
  const { data, isPending, isError, error } = useQuery(
    issueNotificationRulesQueryOptions({ projectRef: ref })
  )
  // Only for check titles in each row; rows fall back to a count while these load
  const { data: checks = [] } = useQuery(issueChecksQueryOptions({ projectRef: ref }))
  const checkTitles = new Map(checks.map((check) => [check.id, check.title]))

  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Notifications</PageHeaderTitle>
            <PageHeaderDescription>
              Notify when issues open or reopen. Repeated detections won’t send more notifications.
            </PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <Button
              variant="default"
              icon={<PlusIcon />}
              disabled={!ref || isPending || isError}
              onClick={() => setEditingRule('new')}
            >
              Add rule
            </Button>
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="small" className="pb-12">
        <PageSection>
          <PageSectionContent>
            {isPending && <GenericSkeletonLoader />}
            {isError && (
              <AlertError error={error} subject="Failed to retrieve notification rules" />
            )}
            {/* Same card as the rule list, so adding the first rule doesn't shift the layout */}
            {data?.length === 0 && (
              <Card>
                <CardContent>
                  <p className="text-sm text-foreground">No notification rules yet</p>
                  <p className="text-sm text-foreground-lighter">
                    Add a rule to send new issues to Slack, Linear, Claude Code, or a webhook.
                  </p>
                </CardContent>
              </Card>
            )}
            {!!data?.length && (
              <Card>
                <ul className="divide-y">
                  {data.map((rule) => (
                    <NotificationRule
                      key={rule.id}
                      rule={rule}
                      projectRef={ref ?? ''}
                      checkTitles={checkTitles}
                      onEdit={() => setEditingRule(rule)}
                    />
                  ))}
                </ul>
              </Card>
            )}
            {editingRule !== undefined && (
              <IssueNotificationRuleDialog
                key={editingRule === 'new' ? 'new' : editingRule.id}
                rule={editingRule === 'new' ? undefined : editingRule}
                projectRef={ref ?? ''}
                onClose={() => setEditingRule(undefined)}
              />
            )}
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

const NotificationRule = ({
  rule,
  projectRef,
  checkTitles,
  onEdit,
}: {
  rule: IssueNotificationRule
  projectRef: string
  checkTitles: ReadonlyMap<string, string>
  onEdit: () => void
}) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const { mutate, isPending } = useIssueNotificationRuleMutation({
    onSuccess: () => setIsDeleteOpen(false),
  })
  const label = `${NOTIFICATION_DESTINATIONS[rule.channel].label} · ${rule.destination}`
  const filters = `${NOTIFICATION_SEVERITIES[rule.severity]} · ${formatNotificationRuleChecks(rule.check_ids, checkTitles)}`
  const checkNames = rule.check_ids.map((id) => checkTitles.get(id) ?? id).join(', ')

  return (
    <li>
      <CardContent className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm leading-normal" title={label}>
            {label}
          </p>
          <p
            className="truncate text-sm leading-normal text-foreground-lighter"
            title={checkNames || undefined}
          >
            {filters}
          </p>
        </div>
        <Switch
          aria-label={`Enable ${label}`}
          checked={rule.is_enabled}
          disabled={isPending}
          onCheckedChange={(is_enabled) =>
            mutate({ action: 'save', projectRef, id: rule.id, rule: { ...rule, is_enabled } })
          }
        />
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="text"
              size="tiny"
              className="size-7 px-0"
              icon={<MoreHorizontalIcon />}
              aria-label={`Options for ${label}`}
              disabled={isPending}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2" onSelect={onEdit}>
              <PencilIcon size={14} />
              Edit rule
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onSelect={() => setIsDeleteOpen(true)}>
              <TrashIcon size={14} />
              Delete rule
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
      <ConfirmationModal
        visible={isDeleteOpen}
        title="Delete notification rule"
        confirmLabel="Delete rule"
        variant="destructive"
        loading={isPending}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={() => mutate({ action: 'delete', projectRef, id: rule.id })}
      >
        <p className="text-sm text-foreground-light">
          Stop sending notifications to {rule.destination} with this rule.
        </p>
      </ConfirmationModal>
    </li>
  )
}
