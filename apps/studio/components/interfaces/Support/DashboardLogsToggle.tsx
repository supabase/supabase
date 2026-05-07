import { ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import {
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  FormField_Shadcn_,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import type { SupportFormValues } from './SupportForm.schema'
import { DASHBOARD_LOG_CATEGORIES } from './dashboard-logs'

interface DashboardLogsToggleProps {
  form: UseFormReturn<SupportFormValues>
  sanitizedLog: unknown[]
}

export function DashboardLogsToggle({ form, sanitizedLog }: DashboardLogsToggleProps) {
  const sanitizedLogJson = useMemo(() => JSON.stringify(sanitizedLog, null, 2), [sanitizedLog])

  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  if (!DASHBOARD_LOG_CATEGORIES.includes(form.getValues('category'))) return

  return (
    <FormField_Shadcn_
      name="attachDashboardLogs"
      control={form.control}
      render={({ field }) => (
        <FormItemLayout
          hideMessage
          name="attachDashboardLogs"
          className="px-6"
          layout="flex"
          label={
            <div className="flex items-center gap-x-2">
              <span className="text-foreground">Include dashboard activity log</span>
            </div>
          }
          description={
            <div className="flex flex-col gap-y-2">
              <span className="text-foreground-light">
                Share sanitized logs of recent dashboard actions to help reproduce the issue.
              </span>
              <Collapsible_Shadcn_ open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <CollapsibleTrigger_Shadcn_ className="group flex items-center gap-x-1 text-sm text-foreground-lighter hover:text-foreground transition">
                  <ChevronRight
                    size={14}
                    className="transition-transform group-data-[state=open]:rotate-90"
                  />
                  <span>Preview log</span>
                </CollapsibleTrigger_Shadcn_>
                <CollapsibleContent_Shadcn_ className="mt-2">
                  <pre className="bg-background-surface-200 border border-strong rounded-lg p-3 max-h-60 overflow-y-auto overflow-x-auto text-xs text-foreground-light whitespace-pre-wrap">
                    {sanitizedLogJson}
                  </pre>
                </CollapsibleContent_Shadcn_>
              </Collapsible_Shadcn_>
            </div>
          }
        >
          <Switch
            size="large"
            id="attachDashboardLogs"
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        </FormItemLayout>
      )}
    />
  )
}
