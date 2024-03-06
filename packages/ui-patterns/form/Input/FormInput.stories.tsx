import { zodResolver } from '@hookform/resolvers/zod'
import { StoryContext, StoryObj } from '@storybook/react'
import { useForm } from 'react-hook-form'
import { Button, Form_Shadcn_ } from 'ui'
import { z } from 'zod'
import { transformSourceForm } from '../../lib/transformSource'
import { FormFieldInput } from './FormInput'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
export default {
  title: 'Form Data Inputs/FormFieldInput',
  component: FormFieldInput,
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

type Story = StoryObj<typeof FormFieldInput>

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
          <FormFieldInput name="username" control={form.control} />
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
