import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button, Form_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { SingleValueFieldArray } from 'ui-patterns/form/SingleValueFieldArray/SingleValueFieldArray'
import { z } from 'zod'

const formSchema = z.object({
  redirectUris: z.array(
    z.object({
      value: z.string().url('Must be a valid URL'),
    })
  ),
})

export default function SingleValueFieldArrayDemo() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      redirectUris: [{ value: 'https://example.com/callback' }],
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form_Shadcn_ {...form}>
      <form className="w-full max-w-2xl" onSubmit={form.handleSubmit(onSubmit)}>
        <FormItemLayout
          label="Redirect URIs"
          description="Use SingleValueFieldArray for repeated single-value rows."
        >
          <SingleValueFieldArray
            control={form.control}
            name="redirectUris"
            valueFieldName="value"
            createEmptyRow={() => ({ value: '' })}
            placeholder="https://example.com/callback"
            addLabel="Add redirect URI"
            removeLabel="Remove redirect URI"
            minimumRows={1}
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
