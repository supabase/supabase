import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Form,
  FormControl,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Textarea,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { CATEGORY_LABELS, ISSUE_CATEGORIES } from './Issues.constants'
import { LogsTableName } from '@/components/interfaces/Settings/Logs/Logs.constants'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { useAlertIssueTypeCreateMutation } from '@/data/alert-issues/alert-issue-type-create-mutation'
import { useAlertRulePreviewMutation } from '@/data/alert-issues/alert-rule-preview-mutation'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'

const FORM_ID = 'alert-log-rule-form'

const LOG_SOURCES = Object.values(LogsTableName)
const RULE_SEVERITIES = ['critical', 'major', 'warning', 'info'] as const
const SEVERITY_LABELS: Record<(typeof RULE_SEVERITIES)[number], string> = {
  critical: 'Critical',
  major: 'Major',
  warning: 'Warning',
  info: 'Info',
}

const FormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(120, 'Keep the name under 120 characters'),
  source: z.nativeEnum(LogsTableName),
  filter: z.string().trim().min(1, 'Enter an LQL filter'),
  severity: z.enum(RULE_SEVERITIES),
  category: z.enum(['security', 'performance', 'health']),
  groupBy: z.string().trim(),
})
type FormValues = z.infer<typeof FormSchema>

const defaultValues: FormValues = {
  name: '',
  source: LogsTableName.FN_EDGE,
  filter: '',
  severity: 'warning',
  category: 'health',
  groupBy: '',
}

const toLql = (source: string, filter: string) => `f:${source} ${filter.trim()}`

type AlertLogRuleSheetProps = { projectRef: string; open: boolean; onClose: () => void }

/** Creates a custom alert issue type: an LQL filter that Logflare runs on a schedule. */
export const AlertLogRuleSheet = ({ projectRef, open, onClose }: AlertLogRuleSheetProps) => {
  const form = useForm<FormValues>({ resolver: zodResolver(FormSchema), defaultValues })
  const preview = useAlertRulePreviewMutation()

  const close = () => {
    form.reset(defaultValues)
    preview.reset()
    onClose()
  }

  const { confirmOnClose, handleOpenChange, modalProps } = useConfirmOnClose({
    checkIsDirty: () => form.formState.isDirty,
    onClose: close,
  })

  const { mutate: createRule, isPending: isCreating } = useAlertIssueTypeCreateMutation({
    onSuccess: (rule) => {
      toast.success(`Created ${rule.name}. Logflare checks it every minute.`)
      close()
    },
  })

  const onSubmit = (values: FormValues) =>
    createRule({
      projectRef,
      name: values.name,
      lql: toLql(values.source, values.filter),
      severity: values.severity,
      category: values.category,
      group_by: values.groupBy ? [values.groupBy] : [],
    })

  const onTestFilter = async () => {
    const isValid = await form.trigger('filter')
    if (!isValid) return
    const { source, filter } = form.getValues()
    preview.mutate({ projectRef, lql: toLql(source, filter) })
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent size="lg" className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>New log rule</SheetTitle>
          <SheetDescription>
            Logflare runs the filter every minute over the last 5 minutes of logs. Matching events
            open an alert issue, one per group by value.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="grow overflow-auto">
            <SheetSection className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItemLayout layout="horizontal" label="Name">
                    <FormControl className="col-span-6">
                      <Input {...field} placeholder="Stripe webhook errors" />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItemLayout layout="horizontal" label="Log source">
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl className="col-span-6">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LOG_SOURCES.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItemLayout>
                )}
              />
              <FormField
                control={form.control}
                name="filter"
                render={({ field }) => (
                  <FormItemLayout
                    layout="horizontal"
                    label="LQL filter"
                    description="For example m.status:>=500 or m.function_id:stripe-webhook"
                  >
                    <FormControl className="col-span-6">
                      <Textarea
                        {...field}
                        rows={3}
                        className="font-mono"
                        placeholder="m.status:>=500"
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
              <div className="flex flex-col gap-2">
                <div className="flex justify-end">
                  <Button
                    variant="default"
                    size="tiny"
                    loading={preview.isPending}
                    onClick={onTestFilter}
                  >
                    Test filter
                  </Button>
                </div>
                {preview.isError && (
                  <p className="text-sm text-destructive">{preview.error.message}</p>
                )}
                {preview.data && (
                  <div className="flex flex-col gap-1 rounded-md border border-default p-3">
                    <p className="text-sm text-foreground">
                      {`${preview.data.total} matching ${preview.data.total === 1 ? 'event' : 'events'} in the last hour`}
                    </p>
                    <ul className="flex flex-col gap-0.5 font-mono text-xs text-foreground-light">
                      {preview.data.events.slice(0, 5).map((event) => (
                        <li key={event.id} className="truncate">
                          {event.event_message ?? ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </SheetSection>
            <Separator />
            <SheetSection className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItemLayout layout="horizontal" label="Severity">
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl className="col-span-6">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RULE_SEVERITIES.map((severity) => (
                          <SelectItem key={severity} value={severity}>
                            {SEVERITY_LABELS[severity]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItemLayout>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItemLayout layout="horizontal" label="Category">
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl className="col-span-6">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ISSUE_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {CATEGORY_LABELS[category]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItemLayout>
                )}
              />
              <FormField
                control={form.control}
                name="groupBy"
                render={({ field }) => (
                  <FormItemLayout
                    layout="horizontal"
                    label="Group by"
                    description="Optional. A field path such as metadata.function_id opens one alert issue per value."
                  >
                    <FormControl className="col-span-6">
                      <Input {...field} className="font-mono" placeholder="metadata.function_id" />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
          </form>
        </Form>
        <SheetFooter className="shrink-0">
          <Button variant="default" disabled={isCreating} onClick={confirmOnClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" loading={isCreating}>
            Create log rule
          </Button>
        </SheetFooter>
        <DiscardChangesConfirmationDialog {...modalProps} />
      </SheetContent>
    </Sheet>
  )
}
