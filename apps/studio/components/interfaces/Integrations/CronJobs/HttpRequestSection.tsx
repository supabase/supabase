import { UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a method for the HTTP request" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
              </SelectContent>
            </Select>
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
            <InputGroup>
              <InputGroupInput {...rest} type="number" placeholder="1000" />
              <InputGroupAddon align="inline-end">
                <InputGroupText> ms</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </FormItemLayout>
        )}
      />
    </SheetSection>
  )
}
