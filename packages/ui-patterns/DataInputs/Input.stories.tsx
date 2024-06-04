import { StoryObj } from '@storybook/react'
import { Input } from './Input'
import { User } from 'lucide-react'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
export default {
  title: 'Data Inputs/Input',
  component: Input,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  decorators: [
    (Story: any) => {
      return (
        <div className="w-80">
          <Story />
        </div>
      )
    },
  ],
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  // argTypes: {},
}

// export default meta

type Story = StoryObj<typeof Input>

export const Primary: Story = {
  render: function Render(args) {
    return <Input {...args} />
  },
  args: {
    placeholder: 'mildtomato',
  },
}

export const withIcon: Story = {
  render: function Render(args) {
    return <Input {...args} />
  },
  args: {
    placeholder: 'mildtomato',
    icon: <User className="text-foreground-muted" strokeWidth={1.5} size={21} />,
  },
}

export const withCopy: Story = {
  render: function Render(args) {
    return <Input {...args} />
  },
  args: {
    placeholder: 'mildtomato',
    copy: true,
  },
}

export const size: Story = {
  render: function Render(args) {
    return <Input {...args} />
  },
  args: {
    placeholder: 'mildtomato',
    size: 'small',
  },
}
