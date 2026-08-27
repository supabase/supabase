import HCaptcha from '@hcaptcha/react-hcaptcha'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { useRef, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Calendar,
  DialogSectionSeparator,
  Form,
  FormControl,
  FormField,
  Input,
  Textarea,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import {
  DatePicker,
  DatePickerButton,
  DatePickerContent,
  DatePickerTrigger,
} from 'ui-patterns/DatePicker'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { SingleValueFieldArray } from 'ui-patterns/form/SingleValueFieldArray/SingleValueFieldArray'
import * as z from 'zod'

import {
  StandaloneFormCard,
  StandaloneFormCardContent,
  StandaloneFormCardFooter,
  StandaloneFormPanelHeading,
} from '@/components/layouts/StandaloneFormPageLayout'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { InlineLink } from '@/components/ui/InlineLink'
import { useCreateAccountRecoveryRequestMutation } from '@/data/account-recovery/create-account-recovery-request-mutation'
import { usePreventNavigationOnUnsavedChanges } from '@/hooks/ui/usePreventNavigationOnUnsavedChanges'

const lostAccountSchema = z.object({
  email: z
    .string()
    .min(1, 'Please provide an email address.')
    .email('Must be a valid email address.'),
  organization: z.string(),
  projectRefs: z.array(
    z.object({
      value: z.string().optional(),
    })
  ),
  invoices: z.array(
    z.object({
      number: z.string().optional(),
      amount: z.union([z.literal(''), z.coerce.number()]).optional(),
      issueDate: z.date().optional(),
    })
  ),
  members: z.array(
    z.object({
      value: z.union([z.literal(''), z.string().email('Must be a valid email address.')]),
    })
  ),
  notes: z.string().optional(),
})

type LostAccountAccessFormData = z.infer<typeof lostAccountSchema>

export const LostAccountAccessFormWizard = () => {
  const [email, setEmail] = useState('')

  if (email) {
    return (
      <div className="flex flex-col gap-y-6">
        <StandaloneFormCard>
          <StandaloneFormCardContent>
            <ConfirmAccountRecoveryRequest email={email} />
          </StandaloneFormCardContent>
        </StandaloneFormCard>
        <AccountRecoverySecurityNote />
      </div>
    )
  }

  return <LostAccountAccessForm onSuccess={(email) => setEmail(email)} />
}

const ConfirmAccountRecoveryRequest = ({ email }: { email: string }) => {
  return (
    <div className="px-6 flex flex-col gap-y-2">
      <StandaloneFormPanelHeading>Check your email</StandaloneFormPanelHeading>
      <p className="text-sm text-foreground-light">
        We sent a reset code to <span className="text-foreground">{email}</span>. If you’re
        eligible, you’ll receive an email with next steps. This can take a little while.
      </p>
    </div>
  )
}

const AccountRecoverySecurityNote = () => {
  return (
    <Admonition
      type="note"
      description={
        <>
          Supabase will never ask you for your password, a token, an API key, or a database
          connection string during account recovery, by email, in this flow, or anywhere else.{' '}
          <InlineLink href="/docs/security/account-recovery">Learn more</InlineLink>
        </>
      }
    />
  )
}

const LostAccountAccessForm = ({ onSuccess }: { onSuccess: (email: string) => void }) => {
  const captchaRef = useRef<HCaptcha>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const form = useForm<LostAccountAccessFormData>({
    resolver: zodResolver(lostAccountSchema),
    defaultValues: {
      email: '',
      organization: '',
      projectRefs: [{ value: '' }],
      members: [{ value: '' }],
    },
  })

  const { mutate: createAccountRecoveryRequest, isPending } =
    useCreateAccountRecoveryRequestMutation({
      onSuccess: (_, variables) => {
        onSuccess(variables.email)
      },
      onError: (error) => {
        setCaptchaToken(null)
        captchaRef.current?.resetCaptcha()
        toast.error(`Failed to create the account recovery request: ${error.message}`)
      },
    })

  const { isDirty } = form.formState
  const hasUnsavedChanges = isDirty && !isPending

  const { handleCancelNavigation, handleConfirmNavigation, shouldConfirmNavigation } =
    usePreventNavigationOnUnsavedChanges({
      hasChanges: hasUnsavedChanges,
    })

  const onRequestAccountRecovery: SubmitHandler<LostAccountAccessFormData> = async (data) => {
    let token = captchaToken
    if (!token) {
      const captchaResponse = await captchaRef.current?.execute({ async: true })
      token = captchaResponse?.response ?? null
    }

    const projectRefs = data.projectRefs.map((p) => p.value).filter((p) => isNotEmpty(p))
    const memberEmails = data.members.map((m) => m.value).filter((p) => isNotEmpty(p))

    createAccountRecoveryRequest({
      email: data.email,
      organization: data.organization,
      projectRefs,
      invoices: (data.invoices ?? []).map((i) => ({
        amount: i.amount != '' ? i.amount : undefined,
        number: i.number,
        issueDate: i.issueDate != null ? format(i.issueDate, 'yyyy-MM-dd') : undefined,
      })),
      memberEmails,
      notes: data.notes,
      hcaptchaToken: token,
    })
  }

  return (
    <Form {...form}>
      <form
        method="POST"
        className="flex flex-col"
        onSubmit={form.handleSubmit(onRequestAccountRecovery)}
      >
        <div className="h-0 overflow-hidden" aria-hidden="true">
          <HCaptcha
            ref={captchaRef}
            sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
            size="invisible"
            onVerify={(token) => {
              setCaptchaToken(token)
            }}
            onExpire={() => {
              setCaptchaToken(null)
            }}
          />
        </div>
        <StandaloneFormCard>
          <StandaloneFormCardContent className="flex flex-col gap-y-6">
            <div className="px-6 flex flex-col gap-y-2">
              <StandaloneFormPanelHeading>Can’t access your account?</StandaloneFormPanelHeading>
              <p className="text-sm text-foreground-light">
                Fill in what you can. Leave blank any fields that don’t apply to your account.
              </p>
            </div>

            <div className="px-6 flex flex-col gap-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItemLayout label="Email" description="How we find your account.">
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="you@example.com"
                        disabled={isPending}
                        autoComplete="email"
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
              <FormField
                control={form.control}
                name="organization"
                render={({ field }) => (
                  <FormItemLayout
                    label="Organization name or slug"
                    labelOptional="Optional"
                    description="From your organization settings. Either is fine."
                  >
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Acme"
                        disabled={isPending}
                        autoComplete="off"
                        data-1p-ignore
                        data-lpignore="true"
                        data-form-type="other"
                        data-bwignore
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
              <FormField
                control={form.control}
                name="projectRefs"
                render={() => (
                  <FormItemLayout
                    label="Project IDs"
                    labelOptional="Optional"
                    description="Leave blank if you’re not sure. Only include project IDs you’re confident about."
                  >
                    <SingleValueFieldArray
                      control={form.control}
                      name="projectRefs"
                      valueFieldName="value"
                      createEmptyRow={() => ({ value: '' })}
                      placeholder="abcdefghijklmnopqrst"
                      addLabel="Add another project"
                      removeLabel="Remove project"
                      minimumRows={1}
                    />
                  </FormItemLayout>
                )}
              />
            </div>

            <DialogSectionSeparator />

            <div className="px-6">
              <FormItemLayout
                label="Last two invoices"
                labelOptional="Optional"
                description="Paid plans only."
              >
                <div className="flex flex-col gap-y-8">
                  <InvoiceFields
                    index={0}
                    label="Most recent invoice"
                    control={form.control}
                    disabled={isPending}
                  />
                  <InvoiceFields
                    index={1}
                    label="Previous invoice"
                    control={form.control}
                    disabled={isPending}
                  />
                </div>
              </FormItemLayout>
            </div>

            <DialogSectionSeparator />

            <div className="px-6">
              <FormField
                control={form.control}
                name="members"
                render={() => (
                  <FormItemLayout
                    label="Other members’ email addresses"
                    labelOptional="Optional"
                    description="If your organization has other members, list their email addresses. We use these to corroborate your identity, not as the only proof we need."
                    hideMessage
                  >
                    <SingleValueFieldArray
                      control={form.control}
                      name="members"
                      valueFieldName="value"
                      createEmptyRow={() => ({ value: '' })}
                      placeholder="teammate@example.com"
                      addLabel="Add another teammate"
                      removeLabel="Remove teammate"
                      minimumRows={1}
                    />
                  </FormItemLayout>
                )}
              />
            </div>

            <DialogSectionSeparator />

            <div className="px-6">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItemLayout
                    label="Notes"
                    labelOptional="Optional"
                    description="Include any other information that can help us recover your account."
                  >
                    <FormControl>
                      <Textarea {...field} rows={4} className="max-h-48 resize-y" />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </div>
          </StandaloneFormCardContent>

          <StandaloneFormCardFooter>
            <Button block type="submit" size="medium" disabled={isPending} loading={isPending}>
              Submit recovery request
            </Button>
          </StandaloneFormCardFooter>
        </StandaloneFormCard>
      </form>
      <DiscardChangesConfirmationDialog
        visible={shouldConfirmNavigation}
        onCancel={handleCancelNavigation}
        onClose={handleConfirmNavigation}
      />
    </Form>
  )
}

const InvoiceFields = ({
  index,
  label,
  control,
  disabled,
}: {
  index: number
  label: string
  control: ReturnType<typeof useForm<LostAccountAccessFormData>>['control']
  disabled: boolean
}) => {
  return (
    <div className="flex flex-col gap-y-2">
      <p className="text-sm text-foreground-light">{label}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField
          control={control}
          name={`invoices.${index}.number`}
          render={({ field }) => (
            <FormItemLayout label="Invoice number">
              <FormControl>
                <Input {...field} type="text" placeholder="INV-001" disabled={disabled} />
              </FormControl>
            </FormItemLayout>
          )}
        />
        <FormField
          control={control}
          name={`invoices.${index}.amount`}
          render={({ field }) => (
            <FormItemLayout label="Amount">
              <FormControl>
                <Input {...field} type="number" placeholder="25.00" disabled={disabled} />
              </FormControl>
            </FormItemLayout>
          )}
        />
        <FormField
          control={control}
          name={`invoices.${index}.issueDate`}
          render={({ field, fieldState }) => (
            <FormItemLayout label="Date">
              <FormControl>
                <DatePicker>
                  <DatePickerTrigger asChild>
                    <DatePickerButton className="w-full" isInvalid={fieldState.invalid}>
                      {field.value ? format(field.value, 'PPP') : 'Invoice payment date'}
                    </DatePickerButton>
                  </DatePickerTrigger>
                  <DatePickerContent>
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </DatePickerContent>
                </DatePicker>
              </FormControl>
            </FormItemLayout>
          )}
        />
      </div>
    </div>
  )
}

const isNotEmpty = (value: string | undefined): value is string => {
  return value != null
}
