'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Checkbox_Shadcn_,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
} from 'ui'
import { z } from 'zod'

const FormSchema = z.object({
  mobile: z.boolean().default(false).optional(),
})

export default function CheckboxReactHookFormSingle() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      mobile: true,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField_Shadcn_
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem_Shadcn_ className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl_Shadcn_>
                <Checkbox_Shadcn_ checked={field.value} onCheckedChange={field.onChange} />
              </FormControl_Shadcn_>
              <div className="space-y-1 leading-none">
                <FormLabel_Shadcn_>Use different settings for my mobile devices</FormLabel_Shadcn_>
                <FormDescription_Shadcn_>
                  You can manage your mobile notifications in the{' '}
                  <Link href="/examples/forms">mobile settings</Link> page.
                </FormDescription_Shadcn_>
              </div>
            </FormItem_Shadcn_>
          )}
        />
        <Button htmlType="submit">Submit</Button>
      </form>
    </Form_Shadcn_>
  )
}
