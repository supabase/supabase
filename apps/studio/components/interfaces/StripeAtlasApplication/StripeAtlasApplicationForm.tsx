import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button, Form, FormControl, FormField, Input } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import {
  useStripeAtlasApplicationCompleteMutation,
  type StripeAtlasApplicationData,
} from '@/data/stripe-atlas/stripe-atlas-application-query'

const FormSchema = z.object({
  firstname: z.string().trim().min(1, 'First name is required').max(100, 'Maximum 100 characters'),
  lastname: z.string().trim().min(1, 'Last name is required').max(100, 'Maximum 100 characters'),
  companyName: z
    .string()
    .trim()
    .min(1, 'Company name is required')
    .max(200, 'Maximum 200 characters'),
})

type FormValues = z.infer<typeof FormSchema>

type StripeAtlasApplicationFormProps = {
  application: StripeAtlasApplicationData
}

export const StripeAtlasApplicationForm = ({ application }: StripeAtlasApplicationFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      firstname: application.firstname ?? '',
      lastname: application.lastname ?? '',
      companyName: application.companyName ?? '',
    },
  })

  const {
    mutate: completeApplication,
    isPending,
    isSuccess,
  } = useStripeAtlasApplicationCompleteMutation()

  return (
    <>
      <div role="status" aria-live="polite">
        {isSuccess && (
          <Admonition
            type="success"
            title="Application confirmed"
            description={<p>We've sent your credit code to your Stripe Atlas Merchant email.</p>}
          />
        )}
      </div>

      {!isSuccess && (
        <Form {...form}>
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) =>
              completeApplication({ ...values, stripeAtlasToken: application.stripeAtlasToken })
            )}
          >
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstname"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label="First name">
                    <FormControl>
                      <Input {...field} autoComplete="given-name" />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
              <FormField
                control={form.control}
                name="lastname"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label="Last name">
                    <FormControl>
                      <Input {...field} autoComplete="family-name" />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItemLayout layout="vertical" label="Company name">
                  <FormControl>
                    <Input {...field} autoComplete="organization" />
                  </FormControl>
                </FormItemLayout>
              )}
            />

            <Button block size="medium" type="submit" loading={isPending} disabled={isPending}>
              {isPending ? 'Confirming application...' : 'Confirm application'}
            </Button>
          </form>
        </Form>
      )}
    </>
  )
}
