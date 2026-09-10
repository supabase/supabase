import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, CardContent, Form, FormControl, FormField, Input } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import { getSubmissionErrorState, type PerkApplicationData } from './StripeAtlasApplication.utils'
import { useCompleteStripeAtlasApplicationMutation } from '@/data/partners/stripe-atlas-complete-mutation'
import { useCountdown } from '@/hooks/misc/useCountdown'

const FormSchema = z.object({
  firstname: z.string().trim().min(1, 'First name is required').max(100, 'Maximum 100 characters'),
  lastname: z.string().trim().min(1, 'Last name is required').max(100, 'Maximum 100 characters'),
  companyName: z
    .string()
    .trim()
    .min(1, 'Company name is required')
    .max(200, 'Maximum 200 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(254, 'Maximum 254 characters')
    .email('Enter a valid email address'),
})

type FormValues = z.infer<typeof FormSchema>

export const StripeAtlasApplicationForm = ({
  data,
  onSuccess,
}: {
  data: PerkApplicationData
  onSuccess: (email: string) => void
}) => {
  const [retryAvailableAt, setRetryAvailableAt] = useState<number | undefined>(undefined)
  const { remaining, isCountingDown } = useCountdown(retryAvailableAt)

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    mode: 'onBlur',
    defaultValues: {
      firstname: data.firstname ?? '',
      lastname: data.lastname ?? '',
      companyName: data.companyName ?? '',
      email: data.email ?? '',
    },
  })

  const {
    mutate: completeApplication,
    isPending,
    error,
  } = useCompleteStripeAtlasApplicationMutation({
    onSuccess: (_result, variables) => onSuccess(variables.email),
    onError: (submissionError) => {
      const { retryAfterSeconds } = getSubmissionErrorState(submissionError)
      setRetryAvailableAt(
        retryAfterSeconds === undefined ? undefined : Date.now() + retryAfterSeconds * 1000
      )
    },
  })

  const errorState = error ? getSubmissionErrorState(error) : undefined
  const isSubmitVisible = (errorState?.isRetryable ?? true) && !isCountingDown

  const onSubmit = (values: FormValues) => {
    completeApplication({ ...values, stripeAtlasToken: data.stripeAtlasToken })
  }

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-4 border-none">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="firstname"
              render={({ field }) => (
                <FormItemLayout layout="vertical" label="First name" id="firstname">
                  <FormControl>
                    <Input {...field} id="firstname" autoComplete="given-name" />
                  </FormControl>
                </FormItemLayout>
              )}
            />
            <FormField
              control={form.control}
              name="lastname"
              render={({ field }) => (
                <FormItemLayout layout="vertical" label="Last name" id="lastname">
                  <FormControl>
                    <Input {...field} id="lastname" autoComplete="family-name" />
                  </FormControl>
                </FormItemLayout>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItemLayout layout="vertical" label="Company name" id="companyName">
                <FormControl>
                  <Input {...field} id="companyName" autoComplete="organization" />
                </FormControl>
              </FormItemLayout>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItemLayout
                layout="vertical"
                label="Email"
                id="email"
                description="We'll email your credit code here."
              >
                <FormControl>
                  <Input {...field} id="email" type="email" autoComplete="email" />
                </FormControl>
              </FormItemLayout>
            )}
          />

          {errorState && (
            <p role="alert" className="text-sm text-destructive text-balance">
              {errorState.message}
            </p>
          )}

          {isSubmitVisible && (
            <Button block size="medium" type="submit" loading={isPending}>
              {error ? 'Try again' : 'Get my credit code'}
            </Button>
          )}

          {isCountingDown && (
            <Button block size="medium" disabled>
              Try again in {remaining}s
            </Button>
          )}
        </CardContent>
      </form>
    </Form>
  )
}
