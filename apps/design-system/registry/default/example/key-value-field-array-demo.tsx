import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button, Form_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { KeyValueFieldArray } from 'ui-patterns/form/KeyValueFieldArray/KeyValueFieldArray'
import { getKeyValueFieldArrayValidationIssues } from 'ui-patterns/form/KeyValueFieldArray/validation'
import { z } from 'zod'

const formSchema = z
  .object({
    headers: z.array(
      z.object({
        name: z.string().trim(),
        value: z.string().trim(),
      })
    ),
  })
  .superRefine((data, ctx) => {
    getKeyValueFieldArrayValidationIssues({
      rows: data.headers,
      keyFieldName: 'name',
      valueFieldName: 'value',
      keyRequiredMessage: 'Header name is required',
      valueRequiredMessage: 'Header value is required',
    }).forEach((issue) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: issue.message,
        path: ['headers', ...issue.path],
      })
    })
  })

export default function KeyValueFieldArrayDemo() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      headers: [{ name: 'x-client-info', value: 'studio-docs' }],
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form_Shadcn_ {...form}>
      <form className="w-full max-w-2xl" onSubmit={form.handleSubmit(onSubmit)}>
        <FormItemLayout
          label="HTTP headers"
          description="Use KeyValueFieldArray for repeated text key/value pairs."
        >
          <KeyValueFieldArray
            control={form.control}
            name="headers"
            keyFieldName="name"
            valueFieldName="value"
            createEmptyRow={() => ({ name: '', value: '' })}
            keyPlaceholder="Header name"
            valuePlaceholder="Header value"
            addLabel="Add header"
            removeLabel="Remove header"
          />
        </FormItemLayout>

        <div className="mt-4">
          <Button size="tiny" type="primary" htmlType="submit">
            Submit
          </Button>
        </div>
      </form>
    </Form_Shadcn_>
  )
}
