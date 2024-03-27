import { zodResolver } from '@hookform/resolvers/zod'
import { StoryContext, StoryObj } from '@storybook/react'
import { useForm } from 'react-hook-form'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  Form_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Calendar,
  cn,
} from 'ui'
import { z } from 'zod'
import { transformSourceForm } from '../../lib/transformSource'
import { FormItemLayout } from './FormItemLayout'
import { Input } from '../../DataInputs/Input'
import { Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
export default {
  title: 'Form/FormItemLayout',
  component: FormItemLayout,
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

type Story = StoryObj<typeof FormItemLayout>

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
              <FormItemLayout {...args}>
                <FormControl_Shadcn_>
                  <Input placeholder="mildtomato" {...field} />
                </FormControl_Shadcn_>
              </FormItemLayout>
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
              <FormItemLayout {...args}>
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
              <FormItemLayout {...args}>
                <FormControl_Shadcn_>
                  <Input placeholder="mildtomato" {...field} />
                </FormControl_Shadcn_>
              </FormItemLayout>
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

export const withCalendar: Story = {
  render: function Render(args) {
    const FormSchema = z.object({
      dob: z.date({
        required_error: 'A date of birth is required.',
      }),
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
        <form className="w-[280px] flex flex-col gap-8" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField_Shadcn_
            name="dob"
            control={form.control}
            render={({ field }) => (
              <FormItemLayout {...args}>
                <Popover_Shadcn_>
                  <PopoverTrigger_Shadcn_ asChild>
                    <FormControl_Shadcn_>
                      <Button
                        icon={<CalendarIcon className="text-foreground-muted" size={16} />}
                        type={'default'}
                        className={cn(!field.value && 'text-muted-foreground', 'justify-start')}
                      >
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </FormControl_Shadcn_>
                  </PopoverTrigger_Shadcn_>
                  <PopoverContent_Shadcn_ className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                      initialFocus
                    />
                  </PopoverContent_Shadcn_>
                </Popover_Shadcn_>
              </FormItemLayout>
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
    layout: 'vertical',
    label: 'Date of birth',
    description: 'Your date of birth is used to calculate your age.',
    labelOptional: 'optional',
    placeholder: 'shadcn',
  },
}
