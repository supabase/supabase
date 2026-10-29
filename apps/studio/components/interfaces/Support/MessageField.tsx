import type { UseFormReturn } from 'react-hook-form'
// End of third-party imports

import { FormControl, FormField, TextArea } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { IPV4SuggestionAlert } from './IPV4SuggestionAlert'
import { IPV4_MIGRATION_STRINGS } from './Support.constants'
import type { SupportFormValues } from './SupportForm.schema'
import { InlineLink } from '@/components/ui/InlineLink'

const SUPPORT_REQUEST_TIPS_URL =
  'https://supabase.com/kb/troubleshooting/formatting-support-requests-for-faster-resolution'

const MESSAGE_MAX_LENGTH = 2500

const MESSAGE_PLACEHOLDER = [
  'Trying to: sign users in with Google OAuth',
  'What happens: /auth/v1/callback returns 500 since 21 Oct, request ID abc123',
  'Tried: rotated client secret, checked redirect URLs',
].join('\n')

interface MessageFieldProps {
  form: UseFormReturn<SupportFormValues>
  originalError: string | null | undefined
}

export function MessageField({ form, originalError }: MessageFieldProps) {
  return (
    <FormField
      name="message"
      control={form.control}
      render={({ field }) => (
        <FormItemLayout
          layout="vertical"
          label="Message"
          labelOptional={`${field.value.length.toLocaleString()} / ${MESSAGE_MAX_LENGTH.toLocaleString()}`}
          description={
            <div className="flex flex-col gap-y-3">
              <p>
                Short, specific requests get faster answers. Tell us what you were trying to do,
                what happened instead, and what you've already tried. If an AI tool drafted this,
                trim it to what you actually need from us.{' '}
                <InlineLink href={SUPPORT_REQUEST_TIPS_URL}>
                  Tips for writing a request we can act on
                </InlineLink>
              </p>
              {IPV4_MIGRATION_STRINGS.some((str) => field.value.includes(str)) && (
                <IPV4SuggestionAlert />
              )}
            </div>
          }
        >
          <FormControl>
            <TextArea
              {...field}
              rows={4}
              maxLength={MESSAGE_MAX_LENGTH}
              placeholder={MESSAGE_PLACEHOLDER}
            />
          </FormControl>
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
