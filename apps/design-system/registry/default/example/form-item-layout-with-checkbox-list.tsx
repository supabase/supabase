import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button, Checkbox_Shadcn_, Form, FormControl, FormField } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

const FormSchema = z.object({
  items: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one item.',
  }),
})

const items = [
  {
    id: 'recents',
    label: 'Recents',
  },
  {
    id: 'home',
    label: 'Home',
  },
  {
    id: 'applications',
    label: 'Applications',
  },
  {
    id: 'desktop',
    label: 'Desktop',
  },
  {
    id: 'downloads',
    label: 'Downloads',
  },
  {
    id: 'documents',
    label: 'Documents',
  },
] as const

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
    <Form {...form}>
      <form className="w-96 flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="items"
          render={() => (
            <FormItemLayout
              label="Sidebar"
              description="Select the items you want to display in the sidebar."
              layout="horizontal"
            >
              {items.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="items"
                  render={({ field }) => {
                    return (
                      <FormItemLayout
                        key={item.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                        label={item.label}
                        layout="flex"
                        hideMessage
                      >
                        <FormControl>
                          <Checkbox_Shadcn_
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(field.value?.filter((value) => value !== item.id))
                            }}
                          />
                        </FormControl>
                      </FormItemLayout>
                    )
                  }}
                />
              ))}
              {/* <FormMessage /> */}
            </FormItemLayout>
          )}
        />
        <Button size="small" type="secondary" htmlType="submit">
          Submit
        </Button>
      </form>
    </Form>
  )
}
