import { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, Input_Shadcn_, SheetSection } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CreateQueueForm } from './CreateQueueSheet.schema'

export function QueueNameField({ form }: { form: UseFormReturn<CreateQueueForm> }) {
  return (
    <SheetSection>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItemLayout label="Name" layout="vertical" className="gap-1 relative">
            <FormControl>
              <Input_Shadcn_ {...field} />
            </FormControl>
            <span className="text-foreground-lighter text-xs absolute top-0 right-0">
              Can include letters, numbers, underscores, and hyphens
            </span>
          </FormItemLayout>
        )}
      />
    </SheetSection>
  )
}
