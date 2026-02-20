'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Calendar,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
} from 'ui'
import { z } from 'zod'

import { cn } from '@/lib/utils'

const FormSchema = z.object({
  dob: z.date({
    required_error: 'A date of birth is required.',
  }),
})

export default function CalendarForm() {
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField_Shadcn_
          control={form.control}
          name="dob"
          render={({ field }) => (
            <FormItem_Shadcn_ className="flex flex-col">
              <FormLabel_Shadcn_>Date of birth</FormLabel_Shadcn_>
              <Popover_Shadcn_>
                <PopoverTrigger_Shadcn_ asChild>
                  <FormControl_Shadcn_>
                    <Button
                      type={'default'}
                      size="small"
                      className={cn(
                        'w-[240px] justify-start',
                        !field.value && 'text-muted-foreground'
                      )}
                      icon={<CalendarIcon className="ml-auto opacity-50" />}
                    >
                      {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </FormControl_Shadcn_>
                </PopoverTrigger_Shadcn_>
                <PopoverContent_Shadcn_ className="w-auto p-0" align="start" side="right">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                    initialFocus
                  />
                </PopoverContent_Shadcn_>
              </Popover_Shadcn_>
              <FormDescription_Shadcn_>
                Your date of birth is used to calculate your age.
              </FormDescription_Shadcn_>
              <FormMessage_Shadcn_ />
            </FormItem_Shadcn_>
          )}
        />
        <Button htmlType="submit">Submit</Button>
      </form>
    </Form_Shadcn_>
  )
}
