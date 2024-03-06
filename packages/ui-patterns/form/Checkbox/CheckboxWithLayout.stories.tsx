import { StoryContext, StoryObj } from '@storybook/react'
import { transformSourceForm } from '../../lib/transformSource'
import { CheckboxWithLayout } from './CheckboxWithLayout'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
export default {
  title: 'Data Inputs with Layout/CheckboxWithLayout',
  component: CheckboxWithLayout,
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

type Story = StoryObj<typeof CheckboxWithLayout>

export const Primary: Story = {
  render: function Render(args) {
    return (
      <div className="w-80">
        <CheckboxWithLayout {...args} />
      </div>
    )
  },
  args: {
    id: 'username',
    name: 'username',
    label: 'Username',
    description: 'this is the description',
  },
}
