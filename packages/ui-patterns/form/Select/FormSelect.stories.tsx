import { zodResolver } from '@hookform/resolvers/zod'
import { StoryObj, StoryContext } from '@storybook/react'
import { useForm } from 'react-hook-form'
import {
  Button,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { z } from 'zod'
import { transformSourceForm } from '../../lib/transformSource'
import { FormSelect, FormSelectTrigger } from './FormSelect'
import { FormInput } from '../Input/FormInput'
import { InputWithLayout } from '../withLayout/InputWithLayout'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
export default {
  title: 'Form Data Inputs/FormSelect',
  component: FormSelect,
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
          transformSourceForm(code, StoryContext).replace('_c', 'FormSelect'),
      },
    },
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  // argTypes: {},
}

// export default meta

type Story = StoryObj<typeof FormSelect>

export const Primary: Story = {
  render: function Render(args) {
    const FormSchema = z.object({
      email: z
        .string({
          required_error: 'Please select an email to display.',
        })
        .email(),
      username: z.string().min(2, {
        message: 'Username must be at least 2 characters.',
      }),
    })

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
        <form className="w-[320px] flex flex-col gap-6" onSubmit={form.handleSubmit(onSubmit)}>
          <FormSelect {...args} name="email" control={form.control} layout="vertical">
            <FormSelectTrigger>
              <SelectValue_Shadcn_ placeholder="Select a verified email to display" />
            </FormSelectTrigger>
            <SelectContent_Shadcn_>
              <SelectItem_Shadcn_ value="m@example.com">m@example.com</SelectItem_Shadcn_>
              <SelectItem_Shadcn_ value="m@google.com">m@google.com</SelectItem_Shadcn_>
              <SelectItem_Shadcn_ value="m@support.com">m@support.com</SelectItem_Shadcn_>
            </SelectContent_Shadcn_>
          </FormSelect>
          <Button size="small" type="primary" htmlType="submit">
            Submit
          </Button>
        </form>
      </Form_Shadcn_>
    )
  },
  args: {
    label: 'Email',
    description: 'this is the description',
    labelOptional: 'Optional text',
    placeholder: 'shadcn',
  },
}
