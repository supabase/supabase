'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
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
  FormMessage_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

const FormSchema = z.object({
  email: z
    .string({
      required_error: 'Please select an email to display.',
    })
    .email(),
})

export default function SelectForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <FormField_Shadcn_
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem_Shadcn_>
              <FormLabel_Shadcn_>Email</FormLabel_Shadcn_>
              <Select_Shadcn_ onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl_Shadcn_>
                  <SelectTrigger_Shadcn_>
                    <SelectValue_Shadcn_ placeholder="Select a verified email to display" />
                  </SelectTrigger_Shadcn_>
                </FormControl_Shadcn_>
                <SelectContent_Shadcn_>
                  <SelectItem_Shadcn_ value="m@example.com">m@example.com</SelectItem_Shadcn_>
                  <SelectItem_Shadcn_ value="m@google.com">m@google.com</SelectItem_Shadcn_>
                  <SelectItem_Shadcn_ value="m@support.com">m@support.com</SelectItem_Shadcn_>
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
              <FormDescription_Shadcn_>
                You can manage email addresses in your{' '}
                <Link href="/examples/forms">email settings</Link>.
              </FormDescription_Shadcn_>
              <FormMessage_Shadcn_ />
            </FormItem_Shadcn_>
          )}
        />
        <Button htmlType="submit" type="secondary">
          Submit
        </Button>
      </form>
    </Form_Shadcn_>
  )
}
