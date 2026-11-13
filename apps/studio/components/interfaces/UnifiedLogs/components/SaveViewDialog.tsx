import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  Input,
} from 'ui'
import { type FilterGroup } from 'ui-patterns/FilterBar'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import type { LogsViewDraft } from '../UnifiedLogs.views'
import {
  buildFilterSummary,
  buildOptionsSummary,
  isDuplicateViewName,
  type FilterSummaryPill,
} from './SaveViewDialog.utils'

interface SaveViewDialogProps {
  visible: boolean
  onCancel: () => void
  onSave: (input: LogsViewDraft) => Promise<void>
  logSource: string
  filters: FilterGroup
  viewOptions: Record<string, unknown>
  existingNames: string[]
  columnLabels: Record<string, string>
}

const defaultValues = { name: '' }

// Mirrors the read-only parts of `FilterCondition`'s pill styling (ui-patterns/FilterBar)
// so filters and options look the same here as filters do on the filter bar itself.
const Pill = ({ children }: { children: ReactNode }) => (
  <div className="h-[26px] rounded-sm border bg-muted flex items-stretch shrink-0">{children}</div>
)

const PillSegment = ({ className, children }: { className?: string; children: ReactNode }) => (
  <span className={cn('text-xs leading-4 flex items-center whitespace-nowrap', className)}>
    {children}
  </span>
)

const FilterPill = ({ label, operator, value }: FilterSummaryPill) => (
  <Pill>
    <PillSegment className="pl-2 pr-1 text-foreground-light">{label}</PillSegment>
    <PillSegment className="px-1 text-foreground">{operator}</PillSegment>
    <PillSegment className="pl-1 pr-2 text-foreground truncate max-w-[160px]">{value}</PillSegment>
  </Pill>
)

const OptionPill = ({ label, value }: { label: string; value: string }) => (
  <Pill>
    <PillSegment className="pl-2 pr-1 text-foreground-light">{label}</PillSegment>
    <PillSegment className="pl-1 pr-2 text-foreground truncate max-w-[160px]">{value}</PillSegment>
  </Pill>
)

export const SaveViewDialog = ({
  visible,
  onCancel,
  onSave,
  logSource,
  filters,
  viewOptions,
  existingNames,
  columnLabels,
}: SaveViewDialogProps) => {
  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, 'Enter a name for this view')
          .refine(
            (name) => !isDuplicateViewName(name, existingNames),
            "That name's already taken. Try another."
          ),
      }),
    [existingNames]
  )

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues,
  })
  const { isSubmitting } = form.formState

  const filterSummary = useMemo(
    () => buildFilterSummary(filters, columnLabels),
    [filters, columnLabels]
  )
  const optionsSummary = useMemo(() => buildOptionsSummary(viewOptions), [viewOptions])

  const handleCancel = () => {
    form.reset(defaultValues)
    onCancel()
  }

  const onSubmit = async ({ name }: { name: string }) => {
    try {
      await onSave({ name, logSource, filters, viewOptions })
      form.reset(defaultValues)
      onCancel()
    } catch {
      return
    }
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={() => {
        if (!isSubmitting) handleCancel()
      }}
    >
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>Save current filters as view</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-2 text-sm">
          <div className="flex flex-col gap-3">
            {filterSummary.length > 0 && (
              <div>
                <p className="text-foreground-light mb-1">Filters</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {filterSummary.map((pill, index) => (
                    <FilterPill key={`${pill.label}-${index}`} {...pill} />
                  ))}
                </div>
              </div>
            )}
            {optionsSummary.length > 0 && (
              <div>
                <p className="text-foreground-light mb-1">Options</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {optionsSummary.map((row) => (
                    <OptionPill key={row.label} label={row.label} value={row.text} />
                  ))}
                </div>
              </div>
            )}
          </div>
          <p className="text-foreground-lighter">The time range isn't saved with this view.</p>
        </DialogSection>
        <DialogSectionSeparator />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <DialogSection>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label="Name">
                    <FormControl>
                      <Input {...field} autoFocus placeholder="Enter a name for this view" />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </DialogSection>
            <DialogFooter>
              <Button type="reset" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Save view
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
