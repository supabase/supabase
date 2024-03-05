import { StoryContext, StoryObj } from '@storybook/react'
import { transformSourceForm } from '../lib/transformSource'
import { FormInput } from './FormInput'
import { SelectWithLayout } from './SelectWithLayout'
import {
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
export default {
  title: 'Data Inputs with Layout/SelectWithLayout',
  component: SelectWithLayout,
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

type Story = StoryObj<typeof FormInput>

export const Primary: Story = {
  render: function Render(args) {
    return (
      <div className="w-80">
        <SelectWithLayout
          {...args}
          name="email"
          isForm={false}
          defaultValue={'m@example.com'}
          value={'m@example.com'}
        >
          <SelectTrigger_Shadcn_>
            <SelectValue_Shadcn_ placeholder="Select a verified email to display" />
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_>
            <SelectItem_Shadcn_ value="m@example.com">m@example.com</SelectItem_Shadcn_>
            <SelectItem_Shadcn_ value="m@google.com">m@google.com</SelectItem_Shadcn_>
            <SelectItem_Shadcn_ value="m@support.com">m@support.com</SelectItem_Shadcn_>
          </SelectContent_Shadcn_>
        </SelectWithLayout>
      </div>
    )
  },
  args: {
    label: 'Username',
    description: 'this is the description',
    labelOptional: 'optional',
  },
}
