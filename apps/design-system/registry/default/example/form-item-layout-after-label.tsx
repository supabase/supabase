import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button, Form_Shadcn_, FormControl_Shadcn_, FormField_Shadcn_, Switch } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

const FormSchema = z.object({
  functionName: z.string(),
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
          name="functionName"
          render={({ field }) => (
            <FormItemLayout
              label="Function name"
              description="Name will also be used for the function name in postgres."
              labelOptional="Optional"
              afterLabel={<InfoTooltip side="top">Added after the label</InfoTooltip>}
            >
              <FormControl_Shadcn_>
                <Input placeholder="Name of function" {...field} />
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
