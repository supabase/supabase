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

export const AdvancedSettings = ({ form }: { form: UseFormReturn<DestinationPanelSchemaType> }) => {
  const { type } = form.watch()

  return (
    <Accordion_Shadcn_ type="single" collapsible>
      <AccordionItem_Shadcn_ value="item-1" className="border-none">
        <AccordionTrigger_Shadcn_ className="font-normal gap-2 justify-between text-sm">
          Advanced Settings
        </AccordionTrigger_Shadcn_>
        <AccordionContent_Shadcn_ asChild className="!pb-0">
          <FormField_Shadcn_
            control={form.control}
            name="maxFillMs"
            render={({ field }) => (
              <FormItemLayout
                className="mb-4"
                label="Max fill milliseconds"
                layout="vertical"
                description="The maximum amount of time to fill the data in milliseconds. Leave empty to use default value."
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
                    placeholder="Leave empty for default"
                  />
                </FormControl_Shadcn_>
              </FormItemLayout>
            )}
          />
          {type === 'BigQuery' && (
            <FormField_Shadcn_
              control={form.control}
              name="maxStalenessMins"
              render={({ field }) => (
                <FormItemLayout
                  className="mb-4"
                  label="Max staleness minutes"
                  layout="vertical"
                  description="Maximum staleness time allowed in minutes. Leave empty to use default value."
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
                      placeholder="Leave empty for default"
                    />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
          )}
        </AccordionContent_Shadcn_>
      </AccordionItem_Shadcn_>
    </Accordion_Shadcn_>
  )
}
