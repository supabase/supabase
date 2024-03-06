import { zodResolver } from '@hookform/resolvers/zod'
import { StoryContext, StoryObj } from '@storybook/react'
import { useForm } from 'react-hook-form'
import {
  Button,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
} from 'ui'
import { z } from 'zod'
import { transformSourceForm } from '../../lib/transformSource'
import { FormFieldCheckbox, FormItemCheckbox } from './FormCheckbox'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
export default {
  title: 'Form Data Inputs/FormCheckbox',
  component: FormFieldCheckbox,
  decorators: [
    (Story: any) => {
      return <Story />
    },
  ],
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    docs: {
      // controls: { exclude: ['style'] },
      source: {
        language: 'tsx',
        transform: (code: string, StoryContext: StoryContext) =>
          transformSourceForm(code, StoryContext).replace('_c', 'FormCheckbox'),
      },
    },
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  // argTypes: {},
}

// export default meta

type Story = StoryObj<typeof FormFieldCheckbox>

export const Primary: Story = {
  render: function Render(args) {
    const FormSchema = z.object({
      mobile: z.boolean().default(false).optional(),
    })

    const form = useForm<z.infer<typeof FormSchema>>({
      resolver: zodResolver(FormSchema),
      defaultValues: {
        mobile: true,
      },
    })

    function onSubmit(data: z.infer<typeof FormSchema>) {
      console.log(data)
    }
    return (
      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormFieldCheckbox {...args} control={form.control} name="mobile" />
          <Button htmlType="submit">Submit</Button>
        </form>
      </Form_Shadcn_>
    )
  },
  args: {
    label: 'Use different settings for my mobile devices',
    description: 'You can manage your mobile notifications in the mobile settings page.',
  },
}

export const multipleItems: Story = {
  render: function Render(args) {
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

    const form = useForm<z.infer<typeof FormSchema>>({
      resolver: zodResolver(FormSchema),
      defaultValues: {
        items: ['recents', 'home'],
      },
    })

    function onSubmit(data: z.infer<typeof FormSchema>) {
      console.log(data)
    }

    return (
      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField_Shadcn_
            control={form.control}
            name="items"
            render={() => (
              <FormItem_Shadcn_>
                <div className="mb-4">
                  <FormLabel_Shadcn_ className="text-base text-foreground">
                    Sidebar
                  </FormLabel_Shadcn_>
                  <FormDescription_Shadcn_>
                    Select the items you want to display in the sidebar.
                  </FormDescription_Shadcn_>
                </div>
                {items.map((item) => {
                  return (
                    <FormField_Shadcn_
                      key={item.id}
                      control={form.control}
                      name="items"
                      render={({ field }) => {
                        return (
                          <FormItemCheckbox
                            field={field}
                            hideMessage
                            label={item.label}
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(field.value?.filter((value) => value !== item.id))
                            }}
                          />
                        )
                      }}
                    />
                  )
                })}
                <FormMessage_Shadcn_ />
              </FormItem_Shadcn_>
            )}
          />
          <Button htmlType="submit">Submit</Button>
        </form>
      </Form_Shadcn_>
    )
  },
  args: {},
}
