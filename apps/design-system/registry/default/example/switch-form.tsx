'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  Switch,
} from 'ui'

const FormSchema = z.object({
  marketing_emails: z.boolean().default(false).optional(),
  security_emails: z.boolean(),
})

export default function SwitchForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      security_emails: true,
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast('You submitted the following values:', {
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  return (
    <Form_Shadcn_ {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <div>
          <h3 className="mb-4 text-lg font-medium">Email Notifications</h3>
          <div className="space-y-4">
            <FormField_Shadcn_
              control={form.control}
              name="marketing_emails"
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel_Shadcn_ className="text-base">Marketing emails</FormLabel_Shadcn_>
                    <FormDescription_Shadcn_>
                      Receive emails about new products, features, and more.
                    </FormDescription_Shadcn_>
                  </div>
                  <FormControl_Shadcn_>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl_Shadcn_>
                </FormItem_Shadcn_>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="security_emails"
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel_Shadcn_ className="text-base">Security emails</FormLabel_Shadcn_>
                    <FormDescription_Shadcn_>
                      Receive emails about your account security.
                    </FormDescription_Shadcn_>
                  </div>
                  <FormControl_Shadcn_>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled
                      aria-readonly
                    />
                  </FormControl_Shadcn_>
                </FormItem_Shadcn_>
              )}
            />
          </div>
        </div>
        <Button htmlType="submit" type="alternative">
          Submit
        </Button>
      </form>
    </Form_Shadcn_>
  )
}
