import { StoryObj } from '@storybook/react'
import { Badge_Shadcn_ } from 'ui'
import { StatusIcon } from './StatusIcons'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
export default {
  title: 'Icons/StatusIcon',
  component: StatusIcon,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
}

// export default meta

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
// export const Primary = {
//   args: {
//     size: 'small',
//     // visible: true,
//   },
// }

type Story = StoryObj<typeof StatusIcon>

export const Primary: Story = {
  args: {
    variant: 'critical',
  },
  /**
   * 👇 To avoid linting issues, it is recommended to use a function with a capitalized name.
   * If you are not concerned with linting, you may use an arrow function.
   */
  render: function Render(args) {
    return <StatusIcon {...args} />
  },
}

export const withNoBackground: Story = {
  args: {
    variant: 'critical',
    hideBackground: true,
  },
  /**
   * 👇 To avoid linting issues, it is recommended to use a function with a capitalized name.
   * If you are not concerned with linting, you may use an arrow function.
   */
  render: function Render(args) {
    return <StatusIcon {...args} />
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
  },
  /**
   * 👇 To avoid linting issues, it is recommended to use a function with a capitalized name.
   * If you are not concerned with linting, you may use an arrow function.
   */
  render: function Render(args) {
    return <StatusIcon {...args} />
  },
}

export const WithBadgeDestructive: Story = {
  args: {
    variant: 'critical',
  },
  /**
   * 👇 To avoid linting issues, it is recommended to use a function with a capitalized name.
   * If you are not concerned with linting, you may use an arrow function.
   */
  render: function Render(args) {
    return (
      <Badge_Shadcn_ variant={'destructive'} className="flex gap-1">
        <StatusIcon {...args} hideBackground />
        Caution
      </Badge_Shadcn_>
    )
  },
}
export const WithBadgeWarning: Story = {
  args: {
    variant: 'warning',
  },
  /**
   * 👇 To avoid linting issues, it is recommended to use a function with a capitalized name.
   * If you are not concerned with linting, you may use an arrow function.
   */
  render: function Render(args) {
    return (
      <Badge_Shadcn_ variant={'warning'} className="flex gap-1">
        <StatusIcon {...args} hideBackground />
        Caution
      </Badge_Shadcn_>
    )
  },
}
