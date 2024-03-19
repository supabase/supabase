import { StoryObj } from '@storybook/react'
import { AssistantChatForm } from './AssistantChatForm'
import { Box, User } from 'lucide-react'
import { createRef, useRef, useState } from 'react'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
export default {
  title: 'AI/Assistant Chat',
  component: AssistantChatForm,
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

type Story = StoryObj<typeof AssistantChatForm>

export const Primary: Story = {
  render: function Render(args) {
    const textAreaRef = createRef<HTMLTextAreaElement>()
    const [value, setValueState] = useState('')
    const [loading, setLoading] = useState(false)

    function handleSubmit(event: React.FormEvent) {
      // set loading for 3 seconds and then reset
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
      }, 1500)
    }

    return (
      <AssistantChatForm
        {...args}
        textAreaRef={textAreaRef}
        icon={<Box strokeWidth={1.5} size={24} className="text-foreground-muted" />}
        value={value}
        loading={loading}
        disabled={loading}
        onValueChange={(e) => setValueState(e.target.value)}
        onSubmit={async (event) => {
          event.preventDefault()
          handleSubmit(event)
        }}
      />
    )
  },
  args: {
    // placeholder: 'Ask AI a question...',
  },
}
