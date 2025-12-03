import type { ChangeEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import {
  Accordion_Shadcn_,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  Badge,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import type { DestinationPanelSchemaType } from './DestinationPanel.schema'

export const AdvancedSettings = ({ form }: { form: UseFormReturn<DestinationPanelSchemaType> }) => {
  const { type } = form.watch()

  const handleNumberChange =
    (field: { onChange: (value?: number) => void }) => (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      field.onChange(val === '' ? undefined : Number(val))
    }

  return (
    <div className="px-5">
      <Accordion_Shadcn_ type="single" collapsible>
        <AccordionItem_Shadcn_ value="item-1" className="border-none">
          <AccordionTrigger_Shadcn_ className="font-normal gap-2 justify-between text-sm py-3 hover:no-underline">
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-sm font-medium">Advanced settings</span>
              <span className="text-sm text-foreground-lighter font-normal">
                Optional performance tuning
              </span>
            </div>
          </AccordionTrigger_Shadcn_>
          <AccordionContent_Shadcn_ className="!pb-0 space-y-6 pt-3">
            {/* Batch wait time - applies to all destinations */}
            <FormField_Shadcn_
              control={form.control}
              name="maxFillMs"
              render={({ field }) => (
                <FormItemLayout
                  label="Batch wait time (milliseconds)"
                  layout="vertical"
                  description="How long to wait for more changes before sending. Shorter times mean more real-time updates but higher overhead."
                >
                  <FormControl_Shadcn_>
                    <Input_Shadcn_
                      {...field}
                      type="number"
                      value={field.value ?? ''}
                      onChange={handleNumberChange(field)}
                      placeholder="e.g., 5000 (5 seconds)"
                    />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />

            {/* BigQuery-specific: Max staleness */}
            {type === 'BigQuery' && (
              <div className="pt-2">
                <FormField_Shadcn_
                  control={form.control}
                  name="maxStalenessMins"
                  render={({ field }) => (
                    <FormItemLayout
                      label={
                        <div className="flex items-center gap-2">
                          <span>Maximum staleness (minutes)</span>
                          <Badge>BigQuery only</Badge>
                        </div>
                      }
                      layout="vertical"
                      description="Maximum age of cached data before BigQuery reads from base tables at query time. Lower values ensure fresher results but may increase query costs."
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          {...field}
                          type="number"
                          value={field.value ?? ''}
                          onChange={handleNumberChange(field)}
                          placeholder="e.g. 60 (1 hour)"
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </div>
            )}
          </AccordionContent_Shadcn_>
        </AccordionItem_Shadcn_>
      </Accordion_Shadcn_>
    </div>
  )
}
