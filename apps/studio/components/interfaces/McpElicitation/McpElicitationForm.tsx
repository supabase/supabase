import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import {
  Button,
  Form,
  FormField,
  FormInputGroupInput,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Separator,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import z from 'zod'

import type { ElicitationRequest } from './McpElicitation.types'
import {
  getOverwriteWarning,
  getSecretHelperText,
  getSecretPrefixWarning,
} from './McpElicitation.utils'
import { McpElicitationDetails } from './McpElicitationDetails'
import { McpElicitationShell, McpElicitationTrustLine } from './McpElicitationShell'

const FORM_ID = 'mcp-elicitation-form'
const KEY_NAME_FIELD_ID = 'mcp-elicitation-key-name'

const FormSchema = z.object({
  secret: z.string().min(1, 'Enter the key value'),
})

type FormValues = z.infer<typeof FormSchema>

const defaultValues: FormValues = { secret: '' }

export const McpElicitationForm = ({
  request,
  isSaving,
  onSave,
  onCancel,
}: {
  request: ElicitationRequest
  isSaving: boolean
  onSave: (secret: string) => void
  onCancel: () => void
}) => {
  const [isRevealed, setIsRevealed] = useState(false)

  const form = useForm<FormValues>({ resolver: zodResolver(FormSchema), defaultValues })
  const secret = useWatch({ control: form.control, name: 'secret' })

  const { providerHint } = request
  // Stored exactly as typed. Any future paste cleanup has to be visible and
  // confirmed, so nothing here trims or rewrites the value.
  const prefixWarning = getSecretPrefixWarning(secret, providerHint)
  const overwriteWarning = getOverwriteWarning(request)

  return (
    <McpElicitationShell
      title="Store an API key"
      subtitle="Supabase is asking for this key on behalf of a tool call. It never passes through your AI client."
    >
      <McpElicitationTrustLine>
        Only continue if you asked your AI client to store this secret.
      </McpElicitationTrustLine>

      <McpElicitationDetails request={request} />

      <Form {...form}>
        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit((values) => onSave(values.secret))}
          className="flex flex-col gap-6"
        >
          <FormItemLayout isReactForm={false} label="Key name" name={KEY_NAME_FIELD_ID}>
            <InputGroup>
              <InputGroupInput
                id={KEY_NAME_FIELD_ID}
                name={KEY_NAME_FIELD_ID}
                value={request.keyName}
                readOnly
                aria-readonly
              />
              <InputGroupAddon align="inline-end" className="pr-2">
                <Lock size={16} className="text-foreground-muted" aria-hidden />
              </InputGroupAddon>
            </InputGroup>
          </FormItemLayout>

          <div className="flex flex-col gap-2">
            <FormField
              control={form.control}
              name="secret"
              render={({ field }) => (
                <FormItemLayout
                  label="Secret value"
                  description={getSecretHelperText(request.project)}
                >
                  <InputGroup>
                    <FormInputGroupInput
                      {...field}
                      type={isRevealed ? 'text' : 'password'}
                      placeholder="Paste your key"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      disabled={isSaving}
                      // Third-party key, not a Supabase password — keep the
                      // managers from offering to save it as one.
                      data-1p-ignore
                      data-lpignore="true"
                      data-form-type="other"
                      data-bwignore
                    />
                    <InputGroupAddon
                      align="inline-end"
                      className="pr-1 has-[>button]:mr-0 has-[>kbd]:mr-0"
                    >
                      <InputGroupButton
                        size="tiny"
                        variant="text"
                        type="button"
                        className="size-6 shrink-0 p-0"
                        aria-pressed={isRevealed}
                        aria-label={isRevealed ? 'Hide secret value' : 'Show secret value'}
                        icon={isRevealed ? <EyeOff /> : <Eye />}
                        onClick={() => setIsRevealed(!isRevealed)}
                      />
                    </InputGroupAddon>
                  </InputGroup>
                </FormItemLayout>
              )}
            />
            {prefixWarning && <p className="text-xs text-warning-600">{prefixWarning}</p>}
          </div>

          {/* Storing stays enabled: replacing the key is usually the point. */}
          {overwriteWarning && (
            <Admonition type="warning" description={overwriteWarning} className="mb-0" />
          )}

          <div className="flex flex-col gap-2">
            <Button block variant="primary" type="submit" loading={isSaving} disabled={isSaving}>
              {isSaving ? 'Storing...' : 'Store'}
            </Button>
            <Button block variant="text" type="button" disabled={isSaving} onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>

      {providerHint && (
        <>
          <Separator />
          <p className="text-xs text-foreground-light">
            {`Don't have your key? Create one in the `}
            {providerHint.dashboardUrl ? (
              <a
                href={providerHint.dashboardUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-foreground underline underline-offset-2"
              >
                {providerHint.name} dashboard
              </a>
            ) : (
              `${providerHint.name} dashboard`
            )}
            .
          </p>
        </>
      )}
    </McpElicitationShell>
  )
}
