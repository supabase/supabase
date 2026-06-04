'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  RadioGroupCard,
  RadioGroupCardItem,
} from 'ui'
import { z } from 'zod'

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <FormLabel>Notify me about...</FormLabel>
              <FormControl>
                <RadioGroupCard
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-wrap gap-3"
                >
                  <FormItem asChild>
                    <FormControl>
                      <RadioGroupCardItem value="all" label="All new messages" />
                    </FormControl>
                  </FormItem>
                  <FormItem asChild>
                    <FormControl>
                      <RadioGroupCardItem value="mentions" label="Direct messages and mentions" />
                    </FormControl>
                  </FormItem>
                  <FormItem asChild>
                    <FormControl>
                      <RadioGroupCardItem value="none" label="Nothing" />
                    </FormControl>
                  </FormItem>
                </RadioGroupCard>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button htmlType="submit" type="secondary" size="small">
          Submit
        </Button>
      </form>
    </Form>
  )
}
