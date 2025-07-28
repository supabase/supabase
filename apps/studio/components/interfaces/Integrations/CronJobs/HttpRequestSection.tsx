import { UseFormReturn } from 'react-hook-form'

import {
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Input,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SheetSection,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { CreateCronJobForm } from './CreateCronJobSheet'

interface HttpRequestSectionProps {
  form: UseFormReturn<CreateCronJobForm>
}

export const HttpRequestSection = ({ form }: HttpRequestSectionProps) => {
  return (
    <SheetSection className="flex flex-col gap-3">
      <FormField_Shadcn_
        control={form.control}
        name="values.method"
        render={({ field }) => (
          <FormItem_Shadcn_>
            <FormLabel_Shadcn_>Method</FormLabel_Shadcn_>
            <Select_Shadcn_ onValueChange={field.onChange} value={field.value}>
              <FormControl_Shadcn_>
                <SelectTrigger_Shadcn_>
                  <SelectValue_Shadcn_ placeholder="Select a method for the HTTP request" />
                </SelectTrigger_Shadcn_>
              </FormControl_Shadcn_>
              <SelectContent_Shadcn_>
                <SelectItem_Shadcn_ value="GET">GET</SelectItem_Shadcn_>
                <SelectItem_Shadcn_ value="POST">POST</SelectItem_Shadcn_>
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
            <FormMessage_Shadcn_ />
          </FormItem_Shadcn_>
        )}
      />

      <FormField_Shadcn_
        control={form.control}
        name="values.endpoint"
        render={({ field: { ref, ...rest } }) => (
          <FormItemLayout label="Endpoint URL" className="gap-1">
            <FormControl_Shadcn_>
              <Input {...rest} placeholder="https://api.example.com/endpoint" />
            </FormControl_Shadcn_>
          </FormItemLayout>
        )}
      />

      <FormField_Shadcn_
        control={form.control}
        name="values.timeoutMs"
        render={({ field: { ref, ...rest } }) => (
          <FormItemLayout label="Timeout" className="gap-1">
            <Input
              {...rest}
              type="number"
              placeholder="1000"
              actions={<p className="text-foreground-light pr-2">ms</p>}
            />
          </FormItemLayout>
        )}
      />
    </SheetSection>
  )
}
