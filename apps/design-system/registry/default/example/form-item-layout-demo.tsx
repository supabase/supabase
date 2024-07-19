import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button, Form_Shadcn_, FormControl_Shadcn_, FormField_Shadcn_ } from 'ui'
import { z } from 'zod'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const formSchema = z.object({
  username: z.string().min(2, {
    message: 'Username must be at least 2 characters.',
  }),
})

export default function FormItemLayoutDemo() {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
    },
  })

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values)
    // action('form form.handleSubmit(onSubmit)')(values)
  }
  return (
    <Form_Shadcn_ {...form}>
      <form className="w-96 flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField_Shadcn_
          name="username"
          control={form.control}
          render={({ field }) => (
            <FormItemLayout
              label="Username"
              description="This is your public display name"
              labelOptional="optional"
            >
              <FormControl_Shadcn_>
                <Input placeholder="mildtomato" {...field} />
              </FormControl_Shadcn_>
            </FormItemLayout>
          )}
        />
        <Button size="small" type="secondary" htmlType="submit">
          Submit
        </Button>
      </form>
    </Form_Shadcn_>
  )
}
