import React from 'react'
import {
  Button,
  Button_Shadcn_,
  Divider,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormFieldInput } from './Input/FormInput'
import { Box, User, User2 } from 'lucide-react'
import { FormSelect, FormSelectTrigger } from './Select/FormSelect'

// import { Header } from './Header'

export const Page = () => {
  const FormSchema = z.object({
    username: z.string().min(2, {
      message: 'Username must be at least 2 characters.',
    }),
    username_two: z.string().min(4, {
      message: 'Username must be at least 4 characters.',
    }),
    email: z
      .string({
        required_error: 'Please select an email to display.',
      })
      .email(),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: '',
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    console.log(data)
  }

  return (
    <Form_Shadcn_ {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-[620px] flex flex-col gap-4">
        <div>
          <h1 className="text-foreground">Welcome</h1>
          <p className="text-foreground-light">Please fill in the following</p>
        </div>
        <div role="separator" className="h-px bg-border w-full" />
        <FormFieldInput
          control={form.control}
          name="username"
          label="Username"
          layout="horizontal"
          description="What we call you"
          labelOptional="Optional"
          icon={<User2 strokeWidth={1.5} size={16} className="text-foreground-muted" />}
        />
        <FormSelect
          control={form.control}
          name="email"
          layout="horizontal"
          label="Email"
          description="This is your email"
        >
          <FormSelectTrigger>
            <SelectValue_Shadcn_ placeholder="Select a verified email to display" />
          </FormSelectTrigger>
          <SelectContent_Shadcn_>
            <SelectItem_Shadcn_ value="m@example.com">m@example.com</SelectItem_Shadcn_>
            <SelectItem_Shadcn_ value="m@google.com">m@google.com</SelectItem_Shadcn_>
            <SelectItem_Shadcn_ value="m@support.com">m@support.com</SelectItem_Shadcn_>
          </SelectContent_Shadcn_>
        </FormSelect>

        {/* <FormField_Shadcn_
          control={form.control}
          name="username_two"
          render={({ field }) => (
            <FormItem_Shadcn_>
              <FormLabel_Shadcn_>username_two</FormLabel_Shadcn_>
              <FormControl_Shadcn_>
                <Input_Shadcn_ placeholder="shadcn" {...field} />
              </FormControl_Shadcn_>
              <FormDescription_Shadcn_>This is your public display name.</FormDescription_Shadcn_>
              <FormMessage_Shadcn_ />
            </FormItem_Shadcn_>
          )}
        /> */}
        <div role="separator" className="h-px bg-border w-full" />
        <div className="flex flex-row w-full justify-end">
          <Button htmlType="submit">Submit</Button>
        </div>
      </form>
    </Form_Shadcn_>
  )
}

{
  /* <FormField_Shadcn_
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem_Shadcn_>
              <FormLabel_Shadcn_>Username</FormLabel_Shadcn_>
              <FormControl_Shadcn_>
                <Input_Shadcn_ placeholder="shadcn" {...field} />
              </FormControl_Shadcn_>
              <FormDescription_Shadcn_>This is your public display name.</FormDescription_Shadcn_>
              <FormMessage_Shadcn_ />
            </FormItem_Shadcn_>
          )}
        /> */
}
