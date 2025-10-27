'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
} from 'ui'

const FormSchema = z.object({
  type: z.enum(['all', 'mentions', 'none'], {
    required_error: 'You need to select a notification type.',
  }),
})

export default function RadioGroupForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    console.log(JSON.stringify(data, null, 2))
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
          name="type"
          render={({ field }) => (
            <FormItem_Shadcn_ className="space-y-4">
              <FormLabel_Shadcn_>Notify me about...</FormLabel_Shadcn_>
              <FormControl_Shadcn_>
                <RadioGroupStacked onValueChange={field.onChange} defaultValue={field.value}>
                  <FormItem_Shadcn_ asChild>
                    <FormControl_Shadcn_>
                      <RadioGroupStackedItem value="all" label="All new messages" />
                    </FormControl_Shadcn_>
                  </FormItem_Shadcn_>
                  <FormItem_Shadcn_ asChild>
                    <FormControl_Shadcn_>
                      <RadioGroupStackedItem
                        value="mentions"
                        label="Direct messages and mentions"
                      />
                    </FormControl_Shadcn_>
                  </FormItem_Shadcn_>
                  <FormItem_Shadcn_ asChild>
                    <FormControl_Shadcn_>
                      <RadioGroupStackedItem value="none" label="Nothing" />
                    </FormControl_Shadcn_>
                  </FormItem_Shadcn_>
                </RadioGroupStacked>
              </FormControl_Shadcn_>
              <FormMessage_Shadcn_ />
            </FormItem_Shadcn_>
          )}
        />
        <Button htmlType="submit" type="secondary" size="small">
          Submit
        </Button>
      </form>
    </Form_Shadcn_>
  )
}
