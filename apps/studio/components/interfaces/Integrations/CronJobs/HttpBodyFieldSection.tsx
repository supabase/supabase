import { UseFormReturn } from 'react-hook-form'

import {
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  SheetSection,
  TextArea_Shadcn_,
} from 'ui'
import { CreateCronJobForm } from './CreateCronJobSheet'

interface HttpBodyFieldSectionProps {
  form: UseFormReturn<CreateCronJobForm>
}

export const HttpBodyFieldSection = ({ form }: HttpBodyFieldSectionProps) => {
  return (
    <SheetSection>
      <FormField_Shadcn_
        control={form.control}
        name="values.httpBody"
        render={({ field }) => (
          <FormItem_Shadcn_ className="gap-1 flex flex-col">
            <FormLabel_Shadcn_>HTTP Request Body</FormLabel_Shadcn_>
            <FormControl_Shadcn_>
              <TextArea_Shadcn_
                className="h-72 rounded-none px-4 outline-none"
                value={field.value}
                onChange={field.onChange}
              />
            </FormControl_Shadcn_>
            <FormMessage_Shadcn_ />
          </FormItem_Shadcn_>
        )}
      />
    </SheetSection>
  )
}
