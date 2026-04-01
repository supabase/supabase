import { UseFormReturn } from 'react-hook-form'
import { FormControl_Shadcn_, FormField_Shadcn_, Input_Shadcn_, SheetSection } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CreateQueueForm } from './CreateQueueSheet.schema'

export function QueueNameField({ form }: { form: UseFormReturn<CreateQueueForm> }) {
  return (
    <SheetSection>
      <FormField_Shadcn_
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItemLayout label="Name" layout="vertical" className="gap-1 relative">
            <FormControl_Shadcn_>
              <Input_Shadcn_ {...field} />
            </FormControl_Shadcn_>
            <span className="text-foreground-lighter text-xs absolute top-0 right-0">
              Can include letters, numbers, underscores, and hyphens
            </span>
          </FormItemLayout>
        )}
      />
    </SheetSection>
  )
}
