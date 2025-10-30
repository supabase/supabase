import { UseFormReturn } from 'react-hook-form'

import {
  Accordion_Shadcn_,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { DestinationPanelSchemaType } from './DestinationPanel.schema'

// Shared settings that apply to all destination types
const SharedAdvancedSettings = ({ form }: { form: UseFormReturn<DestinationPanelSchemaType> }) => {
  return (
    <>
      <p className="text-xs font-medium text-foreground-light mb-3">Batch settings</p>
      <FormField_Shadcn_
        control={form.control}
        name="maxFillMs"
        render={({ field }) => (
          <FormItemLayout
            className="mb-4"
            label="Max fill milliseconds"
            layout="vertical"
            description="Maximum time to accumulate changes before sending a batch. Leave empty for default."
          >
            <FormControl_Shadcn_>
              <Input_Shadcn_
                {...field}
                type="number"
                value={field.value ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  field.onChange(val === '' ? undefined : Number(val))
                }}
                placeholder="Default value will be used"
              />
            </FormControl_Shadcn_>
          </FormItemLayout>
        )}
      />
    </>
  )
}

// BigQuery-specific advanced settings
const BigQueryAdvancedSettings = ({
  form,
}: {
  form: UseFormReturn<DestinationPanelSchemaType>
}) => {
  return (
    <>
      <p className="text-xs font-medium text-foreground-light mb-3 mt-6">
        BigQuery-specific settings
      </p>
      <FormField_Shadcn_
        control={form.control}
        name="maxStalenessMins"
        render={({ field }) => (
          <FormItemLayout
            className="mb-4"
            label="Max staleness minutes"
            layout="vertical"
            description="Maximum time data can be stale in BigQuery before refresh. Leave empty for default."
          >
            <FormControl_Shadcn_>
              <Input_Shadcn_
                {...field}
                type="number"
                value={field.value ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  field.onChange(val === '' ? undefined : Number(val))
                }}
                placeholder="Default value will be used"
              />
            </FormControl_Shadcn_>
          </FormItemLayout>
        )}
      />
    </>
  )
}

// Analytics Bucket-specific advanced settings (placeholder for future settings)
const AnalyticsBucketAdvancedSettings = ({
  form,
}: {
  form: UseFormReturn<DestinationPanelSchemaType>
}) => {
  // Placeholder for future Analytics Bucket-specific settings
  return null
}

export const AdvancedSettings = ({ form }: { form: UseFormReturn<DestinationPanelSchemaType> }) => {
  const { type } = form.watch()

  return (
    <Accordion_Shadcn_ type="single" collapsible>
      <AccordionItem_Shadcn_ value="item-1" className="border-none">
        <AccordionTrigger_Shadcn_ className="font-normal gap-2 justify-between text-sm">
          Advanced settings
        </AccordionTrigger_Shadcn_>
        <AccordionContent_Shadcn_ className="!pb-0 space-y-4">
          {/* Shared settings for all destinations */}
          <SharedAdvancedSettings form={form} />

          {/* Destination-specific settings */}
          {type === 'BigQuery' && <BigQueryAdvancedSettings form={form} />}
          {type === 'Analytics Bucket' && <AnalyticsBucketAdvancedSettings form={form} />}
        </AccordionContent_Shadcn_>
      </AccordionItem_Shadcn_>
    </Accordion_Shadcn_>
  )
}
