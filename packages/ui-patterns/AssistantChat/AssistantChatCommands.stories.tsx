import { StoryObj } from '@storybook/react'
import { AssistantChatForm } from './AssistantChatForm'
import { AssistantCommandsPopover } from './AssistantCommandsPopover'
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
        <div className="w-80 h-80">
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

export const CommandsPopover: Story = {
  render: function Render(args) {
    const [commandsOpen, setCommandsOpen] = useState<boolean>(false)
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

    const suggestions = [
      'Add policy for org Inserted User Access',
      'Add policy for User-Specific Todo Access',
      'Add policy for Org Update Restriction',
    ]

    return (
      <>
        <AssistantCommandsPopover
          open={commandsOpen}
          setOpen={setCommandsOpen}
          textAreaRef={textAreaRef}
          value={value}
          setValue={(e) => setValueState(e)}
          suggestions={suggestions}
        >
          <AssistantChatForm
            {...args}
            textAreaRef={textAreaRef}
            value={value}
            loading={loading}
            disabled={loading}
            onValueChange={(e) => setValueState(e.target.value)}
            commandsOpen={commandsOpen}
            setCommandsOpen={setCommandsOpen}
            onSubmit={async (event) => {
              event.preventDefault()
              handleSubmit(event)
            }}
          />
        </AssistantCommandsPopover>
        <p className="text-xs mt-3 text-foreground-lighter">
          Press <span className="bg-surface-300 px-[3px] py-[2px] border rounded">/</span> to open
          commands
        </p>
      </>
    )
  },
  args: {
    // placeholder: 'Ask AI a question...',
  },
}
