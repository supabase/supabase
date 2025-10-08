import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  Badge,
  Button,
  Checkbox_Shadcn_,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

const FormSchema = z.object({
  consistent_settings: z.boolean().default(false).optional(),
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
          name="consistent_settings"
          render={({ field }) => (
            <FormItemLayout
              label="Use consistent settings"
              description="This is your public display name."
              layout="flex"
            >
              <FormControl_Shadcn_>
                <Checkbox_Shadcn_ checked={field.value} onCheckedChange={field.onChange} />
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
