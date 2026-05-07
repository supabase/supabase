import type { UseFormReturn } from 'react-hook-form'
// End of third-party imports

import { FormControl_Shadcn_, FormField_Shadcn_, TextArea_Shadcn_ } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { IPV4SuggestionAlert } from './IPV4SuggestionAlert'
import { IPV4_MIGRATION_STRINGS } from './Support.constants'
import type { SupportFormValues } from './SupportForm.schema'

interface MessageFieldProps {
  form: UseFormReturn<SupportFormValues>
  originalError: string | null | undefined
}

export function MessageField({ form, originalError }: MessageFieldProps) {
  return (
    <FormField_Shadcn_
      name="message"
      control={form.control}
      render={({ field }) => (
        <FormItemLayout
          layout="vertical"
          label="Message"
          labelOptional="5000 character limit"
          description={
            IPV4_MIGRATION_STRINGS.some((str) => field.value.includes(str)) && (
              <IPV4SuggestionAlert />
            )
          }
        >
          <FormControl_Shadcn_>
            <TextArea_Shadcn_
              {...field}
              rows={4}
              maxLength={5000}
              placeholder="Describe the issue you’re facing, along with any relevant information. Please be as detailed and specific as possible."
            />
          </FormControl_Shadcn_>
          {originalError && (
            <Admonition
              showIcon={false}
              type="default"
              className="mt-2 max-h-[150px] overflow-y-auto"
              title="The error that you ran into will be included in your message for reference"
              description={`Error: ${originalError}`}
            />
          )}
        </FormItemLayout>
      )}
    />
  )
}
