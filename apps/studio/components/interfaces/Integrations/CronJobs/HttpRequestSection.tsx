import { UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SheetSection,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CreateCronJobForm } from './CreateCronJobSheet/CreateCronJobSheet.constants'

interface HttpRequestSectionProps {
  form: UseFormReturn<CreateCronJobForm>
}

export const HttpRequestSection = ({ form }: HttpRequestSectionProps) => {
  return (
    <SheetSection className="flex flex-col gap-3">
      <FormField
        control={form.control}
        name="values.method"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Method</FormLabel>
            <Select_Shadcn_ onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger_Shadcn_>
                  <SelectValue_Shadcn_ placeholder="Select a method for the HTTP request" />
                </SelectTrigger_Shadcn_>
              </FormControl>
              <SelectContent_Shadcn_>
                <SelectItem_Shadcn_ value="GET">GET</SelectItem_Shadcn_>
                <SelectItem_Shadcn_ value="POST">POST</SelectItem_Shadcn_>
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="values.endpoint"
        render={({ field: { ref, ...rest } }) => (
          <FormItemLayout label="Endpoint URL" className="gap-1">
            <FormControl>
              <Input {...rest} placeholder="https://api.example.com/endpoint" />
            </FormControl>
          </FormItemLayout>
        )}
      />

      <FormField
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
