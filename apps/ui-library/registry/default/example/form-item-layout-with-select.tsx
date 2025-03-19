import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

const FormSchema = z.object({
  email: z
    .string({
      required_error: 'Please select an email to display.',
    })
    .email(),
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
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItemLayout
              label="Choose email"
              description="Choose preferred email"
              labelOptional="Optional"
            >
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
