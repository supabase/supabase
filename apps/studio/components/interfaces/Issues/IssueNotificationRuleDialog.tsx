import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  CommandGroup,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { MultiSelector } from 'ui-patterns/multi-select'

import { NOTIFICATION_DESTINATIONS, NOTIFICATION_SEVERITIES } from './IssueNotifications.constants'
import { CATEGORY_LABELS, ISSUE_CHECK_CATEGORIES } from './Issues.constants'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { issueChecksQueryOptions } from '@/data/issues/issue-checks-query'
import { useIssueNotificationRuleMutation } from '@/data/issues/issue-notification-rule-mutation'
import {
  issueNotificationChannelSchema,
  issueNotificationRuleInputSchema,
  issueNotificationSeveritySchema,
  type IssueNotificationRule,
  type IssueNotificationRuleInput,
} from '@/data/issues/issue-notification-schema'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'

const FORM_ID = 'issue-notification-rule'
const DEFAULT_VALUES: IssueNotificationRuleInput = {
  channel: 'slack',
  destination: '',
  severity: 'all',
  check_ids: [],
  is_enabled: true,
}

export const IssueNotificationRuleDialog = ({
  rule,
  projectRef,
  onClose,
}: {
  rule?: IssueNotificationRule
  projectRef: string
  onClose: () => void
}) => {
  const form = useForm<IssueNotificationRuleInput>({
    resolver: zodResolver(issueNotificationRuleInputSchema),
    defaultValues: DEFAULT_VALUES,
    values: rule
      ? {
          channel: rule.channel,
          destination: rule.destination,
          severity: rule.severity,
          check_ids: rule.check_ids,
          is_enabled: rule.is_enabled,
        }
      : undefined,
    resetOptions: { keepDirtyValues: true },
  })
  const { isDirty } = form.formState
  const channel = useWatch({ control: form.control, name: 'channel' })
  const destination = NOTIFICATION_DESTINATIONS[channel]
  const {
    data: checks = [],
    isPending: isChecksPending,
    isError: isChecksError,
  } = useQuery(issueChecksQueryOptions({ projectRef }))
  const checkTitles = new Map(checks.map((check) => [check.id, check.title]))
  const { mutate, isPending } = useIssueNotificationRuleMutation({
    onSuccess: () => {
      toast.success(rule ? 'Notification rule updated' : 'Notification rule added')
      onClose()
    },
  })
  const { confirmOnClose, handleOpenChange, modalProps } = useConfirmOnClose({
    checkIsDirty: () => isDirty,
    onClose,
  })

  return (
    <>
      <Dialog open onOpenChange={(open) => !isPending && handleOpenChange(open)}>
        <DialogContent size="small">
          <DialogHeader>
            <DialogTitle>{rule ? 'Edit notification rule' : 'Add notification rule'}</DialogTitle>
            <DialogDescription>Notify when an issue opens or reopens.</DialogDescription>
          </DialogHeader>
          <DialogSectionSeparator />
          <Form {...form}>
            <form
              id={FORM_ID}
              onSubmit={form.handleSubmit((values) => {
                if (!isPending) mutate({ action: 'save', projectRef, id: rule?.id, rule: values })
              })}
            >
              <DialogSection className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="channel"
                  render={({ field }) => (
                    <FormItemLayout layout="vertical" label="Send to">
                      <Select
                        value={field.value}
                        disabled={isPending}
                        onValueChange={(value) => {
                          field.onChange(value)
                          form.setValue('destination', '', { shouldDirty: true })
                          form.clearErrors('destination')
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {issueNotificationChannelSchema.options.map((channel) => (
                            <SelectItem key={channel} value={channel}>
                              {NOTIFICATION_DESTINATIONS[channel].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItemLayout>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItemLayout layout="vertical" label={destination.fieldLabel}>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder={destination.placeholder}
                        />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItemLayout layout="vertical" label="Severity">
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {issueNotificationSeveritySchema.options.map((severity) => (
                            <SelectItem key={severity} value={severity}>
                              {NOTIFICATION_SEVERITIES[severity]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItemLayout>
                  )}
                />
                <FormField
                  control={form.control}
                  name="check_ids"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="vertical"
                      label="Checks"
                      description="Leave empty to notify for every issue"
                    >
                      <MultiSelector
                        values={field.value}
                        onValuesChange={field.onChange}
                        disabled={isPending}
                      >
                        <FormControl>
                          <MultiSelector.Trigger
                            label="All issues"
                            badgeLimit="wrap"
                            renderValue={(id) => checkTitles.get(id) ?? id}
                          />
                        </FormControl>
                        <MultiSelector.Content>
                          <MultiSelector.Input placeholder="Search checks..." />
                          <MultiSelector.List
                            emptyLabel="No checks found"
                            loading={isChecksPending}
                            error={isChecksError}
                            errorLabel="Unable to load checks"
                          >
                            {ISSUE_CHECK_CATEGORIES.map((category) => (
                              <CommandGroup key={category} heading={CATEGORY_LABELS[category]}>
                                {checks
                                  .filter((check) => check.category === category)
                                  .map((check) => (
                                    <MultiSelector.Item key={check.id} value={check.id}>
                                      {check.title}
                                    </MultiSelector.Item>
                                  ))}
                              </CommandGroup>
                            ))}
                          </MultiSelector.List>
                        </MultiSelector.Content>
                      </MultiSelector>
                    </FormItemLayout>
                  )}
                />
              </DialogSection>
            </form>
          </Form>
          <DialogFooter>
            <Button variant="default" disabled={isPending} onClick={confirmOnClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              form={FORM_ID}
              type="submit"
              disabled={!isDirty}
              loading={isPending}
            >
              {rule ? 'Save changes' : 'Add rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DiscardChangesConfirmationDialog {...modalProps} />
    </>
  )
}
