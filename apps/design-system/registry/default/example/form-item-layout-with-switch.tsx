import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button, Form_Shadcn_, FormControl_Shadcn_, FormField_Shadcn_, Switch } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

const FormSchema = z.object({
  switch_option: z.boolean().default(false).optional(),
})

export default function FormItemLayoutDemo() {
  // 1. Define your form.
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof FormSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values)
    // action('form form.handleSubmit(onSubmit)')(values)
  }
  return (
    <Form_Shadcn_ {...form}>
      <form className="w-96 flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField_Shadcn_
          control={form.control}
          name="switch_option"
          render={({ field }) => (
            <FormItemLayout
              afterLabel="Switch"
              label="Use ./supabase directory for everything"
              description="This is an explanation."
              layout="flex"
            >
              <FormControl_Shadcn_>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
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
