import { zodResolver } from '@hookform/resolvers/zod'
import { StoryContext, StoryObj } from '@storybook/react'
import { useForm } from 'react-hook-form'
import {
  Button,
  Checkbox_Shadcn_,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  Form_Shadcn_,
} from 'ui'
import { z } from 'zod'
import { transformSourceForm } from '../../lib/transformSource'
import { FormCheckbox } from './FormCheckbox'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
export default {
  title: 'Form Data Inputs/FormCheckbox',
  component: FormCheckbox,
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

type Story = StoryObj<typeof FormCheckbox>

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
      // <Form_Shadcn_ {...form}>
      //   <form className="w-96 flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)}>
      //     <FormCheckbox {...args} name="username" control={form.control} />
      //     <Button size="small" type="primary" htmlType="submit">
      //       Submit
      //     </Button>
      //   </form>
      // </Form_Shadcn_>

      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* <FormCheckbox
            control={form.control}
            name="mobile"
            label="Use different settings for my mobile devices"
            description="You can manage your mobile notifications in the mobile settings page."
          /> */}
          <FormField_Shadcn_
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem_Shadcn_ className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl_Shadcn_>
                  <Checkbox_Shadcn_ checked={field.value} onCheckedChange={field.onChange} />
                </FormControl_Shadcn_>
                <div className="space-y-1 leading-none">
                  <FormLabel_Shadcn_>
                    Use different settings for my mobile devices
                  </FormLabel_Shadcn_>
                  <FormDescription_Shadcn_>
                    You can manage your mobile notifications in the mobile settings page.
                  </FormDescription_Shadcn_>
                </div>
              </FormItem_Shadcn_>
            )}
          />
          {/* <FormField_Shadcn_
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem_Shadcn_ className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl_Shadcn_>
                <Checkbox_Shadcn_
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Use different settings for my mobile devices
                </FormLabel>
                <FormDescription>
                  You can manage your mobile notifications in the{" "}
                  <Link href="/examples/forms">mobile settings</Link> page.
                </FormDescription>
              </div>
            </FormItem>
          )}
        /> */}
          <Button htmlType="submit">Submit</Button>
        </form>
      </Form_Shadcn_>
    )
  },
  args: {
    label: 'Username',
    description: 'this is the description',
    labelOptional: 'optional',
    placeholder: 'shadcn',
  },
}
