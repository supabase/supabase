import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button, Form, FormControl, FormField, Input } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

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

type StripeAtlasApplicationFormProps = {
  stripeAtlasToken: string
}

/** Mockup only — submitting runs validation and stops there, nothing is sent. */
export const StripeAtlasApplicationForm = (_props: StripeAtlasApplicationFormProps) => {
  // todo(@juleswritescode): fetch data from API via props.stripeAtlasToken; currently just a mockup.

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      firstname: 'Mockey',
      lastname: 'Mockupson',
      companyName: 'Acmo Ck.',
      email: 'me@mo.ck',
    },
  })

  return (
    <Form {...form}>
      <form noValidate className="flex flex-col gap-4" onSubmit={form.handleSubmit(() => {})}>
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
              description="The credit code will be sent to this email."
            >
              <FormControl>
                <Input {...field} id="email" type="email" autoComplete="email" />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <Button block size="medium" type="submit">
          Submit Application
        </Button>
      </form>
    </Form>
  )
}
