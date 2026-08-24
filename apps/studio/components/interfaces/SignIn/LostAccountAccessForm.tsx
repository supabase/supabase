import HCaptcha from '@hcaptcha/react-hcaptcha'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Calendar, Form, FormControl, FormField, Input, Separator } from 'ui'
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

import { useCreateAccountRecoveryRequestMutation } from '@/data/misc/create-account-recovery-request'
import { BASE_PATH } from '@/lib/constants'

const lostAccountSchema = z.object({
  email: z.string().min(1, 'Please provide an email address').email('Must be a valid email'),
  organization: z.string().min(1, 'Please provide an organization name or id'),
  projectIds: z.array(
    z.object({
      value: z.string().optional(),
    })
  ),
  invoices: z.array(
    z.object({
      number: z.string().min(1, 'Please enter the invoice number').optional(),
      amount: z.string().min(1, 'Please enter the invoice amount').optional(),
      date: z.date().optional(),
    })
  ),
  members: z.array(
    z.object({
      value: z.union([z.literal(''), z.string().email('Must be a valid email')]),
    })
  ),
})

type LostAccountAccessFormData = z.infer<typeof lostAccountSchema>

export const LostAccountAccessFormWizard = () => {
  const [email, setEmail] = useState('')

  if (email) {
    return <ConfirmAccountRecoveryRequest email={email} />
  }

  return <LostAccountAccessForm onSuccess={(email) => setEmail(email)} />
}

const ConfirmAccountRecoveryRequest = ({ email }: { email: string }) => {
  return (
    <Admonition
      type="default"
      title={`Check your email (${email}) for a reset code`}
      description="If elligible, you'll get an email with next steps. This can take a little while — there's nothing else to do here right now"
    >
      Supabase will never ask you for your password, a token, an API key, or a database connection
      string during account recovery — by email, in this flow, or anywhere else.{' '}
      <Link href="">What we will and won't ask for.</Link>
    </Admonition>
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
      projectIds: [{ value: '' }],
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

  const onRequestAccountRecovery: SubmitHandler<LostAccountAccessFormData> = async (data) => {
    let token = captchaToken
    if (!token) {
      const captchaResponse = await captchaRef.current?.execute({ async: true })
      token = captchaResponse?.response ?? null
    }

    // TODO: remove this (for dev purpose until backend is ready)
    return onSuccess(data.email)

    // TODO: restore this (for dev purpose until backend is ready)
    // createAccountRecoveryRequest({
    //   email: data.email,
    //   hcaptchaToken: token,
    //   redirectTo: `${
    //     process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
    //       ? location.origin
    //       : process.env.NEXT_PUBLIC_SITE_URL
    //   }${BASE_PATH}/reset-password`,
    // })
  }

  return (
    <Form {...form}>
      <form
        method="POST"
        className="flex flex-col pt-4 space-y-4"
        onSubmit={form.handleSubmit(onRequestAccountRecovery)}
      >
        <Admonition
          type="default"
          title="Fill in what you can. Fields that don't apply to your account can be left blank — that's expected and won't count against you"
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItemLayout label="Email" description="How we find your account">
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
        <Separator />
        <FormField
          control={form.control}
          name="organization"
          render={({ field }) => (
            <FormItemLayout label="Organization name and/or ID">
              <FormControl>
                <Input {...field} type="text" placeholder="" disabled={isPending} />
              </FormControl>
            </FormItemLayout>
          )}
        />
        <Separator />

        <FormField
          control={form.control}
          name="projectIds"
          render={() => (
            <FormItemLayout
              label="Project IDs"
              description="Leave blank if you're not sure — guessing a project ID that doesn't exist is an immediate fail."
            >
              <SingleValueFieldArray
                control={form.control}
                name="projectIds"
                valueFieldName="value"
                createEmptyRow={() => ({ value: '' })}
                placeholder="hpjxqfdtriqhiwoqrdyz"
                addLabel="Add another project"
                removeLabel="Remove project"
              />
            </FormItemLayout>
          )}
        />
        <Separator />

        <div>
          <div className="flex gap-1 mb-4">
            <span className="text-sm text-foreground flex gap-2 items-center wrap-break-word leading-normal">
              Last two invoices
            </span>
            <span className="text-sm text-lighter items-center wrap-break-word leading-normal">
              (Paid plans only).
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4">
            <div className="text-sm text-light">Most recent invoice</div>
            <div className="text-sm text-light">Previous invoice</div>
            <FormField
              control={form.control}
              name="invoices.0.number"
              render={({ field }) => (
                <FormItemLayout label={<span className="sr-only">Invoice number</span>}>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Invoice number"
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItemLayout>
              )}
            />
            <FormField
              control={form.control}
              name="invoices.1.number"
              render={({ field }) => (
                <FormItemLayout label={<span className="sr-only">Invoice number</span>}>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Invoice number"
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItemLayout>
              )}
            />
            <FormField
              control={form.control}
              name="invoices.0.amount"
              render={({ field }) => (
                <FormItemLayout label={<span className="sr-only">Amount</span>}>
                  <FormControl>
                    <Input {...field} type="text" placeholder="Amount" disabled={isPending} />
                  </FormControl>
                </FormItemLayout>
              )}
            />
            <FormField
              control={form.control}
              name="invoices.1.amount"
              render={({ field }) => (
                <FormItemLayout label={<span className="sr-only">Amount</span>}>
                  <FormControl>
                    <Input {...field} type="text" placeholder="Amount" disabled={isPending} />
                  </FormControl>
                </FormItemLayout>
              )}
            />
            <FormField
              control={form.control}
              name="invoices.0.date"
              render={({ field, fieldState }) => (
                <FormItemLayout label={<span className="sr-only">Date</span>}>
                  <FormControl>
                    <DatePicker>
                      <DatePickerTrigger asChild>
                        <DatePickerButton block isInvalid={fieldState.invalid}>
                          {field.value ? format(field.value, 'PPP') : 'Pick a date'}
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
            <FormField
              control={form.control}
              name="invoices.1.date"
              render={({ field, fieldState }) => (
                <FormItemLayout label={<span className="sr-only">Date</span>}>
                  <FormControl>
                    <DatePicker>
                      <DatePickerTrigger asChild>
                        <DatePickerButton block isInvalid={fieldState.invalid}>
                          {field.value ? format(field.value, 'PPP') : 'Pick a date'}
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
        <Separator />

        <FormField
          control={form.control}
          name="members"
          render={() => (
            <FormItemLayout
              label="Other members' email addresses"
              description="Team orgs. Corroborating only — this can't carry your request on its own."
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
              />
            </FormItemLayout>
          )}
        />

        <div className="self-center">
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

        <div className="border-t border-overlay-border" />

        <Button block type="submit" size="medium" disabled={isPending} loading={isPending}>
          Submit recovery request
        </Button>
      </form>
    </Form>
  )
}
