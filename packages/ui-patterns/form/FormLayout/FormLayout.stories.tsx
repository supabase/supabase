import { zodResolver } from '@hookform/resolvers/zod'
import { StoryContext, StoryObj } from '@storybook/react'
import { useForm } from 'react-hook-form'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  Form_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
} from 'ui'
import { z } from 'zod'
import { transformSourceForm } from '../../lib/transformSource'
import { FormLayout } from './FormLayout'
import { Input } from '../../data-inputs/Input'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
export default {
  title: 'Form/FormLayout',
  component: FormLayout,
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
          transformSourceForm(code, StoryContext).replace('_c', 'FormInput'),
      },
    },
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  // argTypes: {},
}

// export default meta

type Story = StoryObj<typeof FormLayout>

export const Primary: Story = {
  render: function Render(args) {
    const formSchema = z.object({
      username: z.string().min(2, {
        message: 'Username must be at least 2 characters.',
      }),
    })

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
              <FormItem_Shadcn_>
                <FormLayout {...args}>
                  <FormControl_Shadcn_>
                    <Input placeholder="mildtomato" {...field} />
                  </FormControl_Shadcn_>
                </FormLayout>
              </FormItem_Shadcn_>
            )}
          />
          <Button size="small" type="primary" htmlType="submit">
            Submit
          </Button>
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

export const withSelect: Story = {
  render: function Render(args) {
    const FormSchema = z.object({
      email: z
        .string({
          required_error: 'Please select an email to display.',
        })
        .email(),
    })

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
              <FormLayout {...args}>
                <FormItem_Shadcn_>
                  <FormControl_Shadcn_>
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
                  </FormControl_Shadcn_>
                </FormItem_Shadcn_>
              </FormLayout>
            )}
          />
          <Button size="small" type="primary" htmlType="submit">
            Submit
          </Button>
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

export const withLayoutChange: Story = {
  render: function Render(args) {
    const formSchema = z.object({
      username: z.string().min(2, {
        message: 'Username must be at least 2 characters.',
      }),
    })

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
        <form className="w-[520px] flex flex-col gap-8" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField_Shadcn_
            name="username"
            control={form.control}
            render={({ field }) => (
              <FormLayout {...args}>
                <FormItem_Shadcn_>
                  <FormControl_Shadcn_>
                    <Input placeholder="mildtomato" {...field} />
                  </FormControl_Shadcn_>
                </FormItem_Shadcn_>
              </FormLayout>
            )}
          />
          <Button size="small" type="primary" htmlType="submit">
            Submit
          </Button>
        </form>
      </Form_Shadcn_>
    )
  },
  args: {
    layout: 'horizontal',
    label: 'Username',
    description: 'this is the description',
    labelOptional: 'optional',
    placeholder: 'shadcn',
  },
}
