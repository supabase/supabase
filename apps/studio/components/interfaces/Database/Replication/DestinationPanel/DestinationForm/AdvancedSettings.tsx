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
  PrePostTab,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { DestinationType } from '../DestinationPanel.types'
import { type DestinationPanelSchemaType } from './DestinationForm.schema'

export const AdvancedSettings = ({
  type,
  form,
}: {
  type: DestinationType
  form: UseFormReturn<DestinationPanelSchemaType>
}) => {
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
          <AccordionContent_Shadcn_ className="!pb-0 pt-3 [&>div]:flex [&>div]:flex-col [&>div]:gap-y-4">
            {/* Batch wait time - applies to all destinations */}
            <FormField_Shadcn_
              control={form.control}
              name="maxFillMs"
              render={({ field }) => (
                <FormItemLayout
                  label="Batch wait time"
                  layout="horizontal"
                  description="How long to wait for more changes before sending. Shorter times mean more real-time updates but higher overhead."
                >
                  <FormControl_Shadcn_>
                    <PrePostTab postTab="milliseconds">
                      <Input_Shadcn_
                        {...field}
                        type="number"
                        value={field.value ?? ''}
                        onChange={handleNumberChange(field)}
                        placeholder="Default: 10000 (10 seconds)"
                      />
                    </PrePostTab>
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />

            {/* BigQuery-specific: Max staleness */}
            {type === 'BigQuery' && (
              <FormField_Shadcn_
                control={form.control}
                name="maxStalenessMins"
                render={({ field }) => (
                  <FormItemLayout
                    label={
                      <div className="flex flex-col gap-y-2">
                        <span>Maximum staleness</span>
                        <Badge className="w-min">BigQuery only</Badge>
                      </div>
                    }
                    layout="horizontal"
                    description="Maximum age of cached data before BigQuery reads from base tables at query time. Lower values ensure fresher results but may increase query costs. Leave empty for no staleness limit."
                  >
                    <FormControl_Shadcn_>
                      <PrePostTab postTab="minutes">
                        <Input_Shadcn_
                          {...field}
                          type="number"
                          value={field.value ?? ''}
                          onChange={handleNumberChange(field)}
                          placeholder="Default: none"
                        />
                      </PrePostTab>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            )}
          </AccordionContent_Shadcn_>
        </AccordionItem_Shadcn_>
      </Accordion_Shadcn_>
    </div>
  )
}
