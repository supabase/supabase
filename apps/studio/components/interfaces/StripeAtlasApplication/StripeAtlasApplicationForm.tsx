import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, CardContent, Form, FormControl, FormField, Input } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import type { StripeAtlasApplicationData } from '@/data/partners/stripe-atlas-application-query'
import { useCompleteStripeAtlasApplicationMutation } from '@/data/partners/stripe-atlas-complete-mutation'

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

interface StripeAtlasApplicationFormProps {
  stripeAtlasToken: string
  /** Prefill from Stripe, editable by the merchant. Any field can be missing. */
  application: StripeAtlasApplicationData
  onSuccess: (email: string) => void
}

export const StripeAtlasApplicationForm = ({
  stripeAtlasToken,
  application,
  onSuccess,
}: StripeAtlasApplicationFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      firstname: application.firstname ?? '',
      lastname: application.lastname ?? '',
      companyName: application.companyName ?? '',
      email: application.email ?? '',
    },
  })

  const { mutate: completeApplication, isPending } = useCompleteStripeAtlasApplicationMutation({
    onSuccess: (_data, variables) => onSuccess(variables.email),
    onError: (error) => toast.error(`Unable to generate your credit code: ${error.message}`),
  })

  const onSubmit = (values: FormValues) => {
    completeApplication({ ...values, stripeAtlasToken })
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

          <Button block size="medium" type="submit" loading={isPending}>
            Get my credit code
          </Button>
        </CardContent>
      </form>
    </Form>
  )
}
