import { UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  SheetSection,
  TextArea_Shadcn_,
} from 'ui'

import { CreateCronJobForm } from './CreateCronJobSheet/CreateCronJobSheet.constants'

interface HttpBodyFieldSectionProps {
  form: UseFormReturn<CreateCronJobForm>
}

export const HttpBodyFieldSection = ({ form }: HttpBodyFieldSectionProps) => {
  return (
    <SheetSection>
      <FormField
        control={form.control}
        name="values.httpBody"
        render={({ field }) => (
          <FormItem className="gap-1 flex flex-col">
            <FormLabel>HTTP Request Body</FormLabel>
            <FormControl>
              <TextArea_Shadcn_
                className="h-72 rounded-none px-4 outline-hidden"
                value={field.value}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </SheetSection>
  )
}
