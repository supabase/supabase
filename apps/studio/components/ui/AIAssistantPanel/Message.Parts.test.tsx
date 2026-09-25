import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ToolUIPart } from 'ai'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { MessageProvider } from './Message.Context'
import { MessagePartSwitcher, MessagePartToolGroup } from './Message.Parts'
import { customRender } from '@/tests/lib/custom-render'

type MessagePart = Parameters<typeof MessagePartSwitcher>[0]['part']

const reasoningPart = {
  type: 'reasoning',
  state: 'done',
  text: 'I will look up the project details.',
} satisfies Extract<MessagePart, { type: 'reasoning' }>

const toolPart = {
  type: 'tool-load_knowledge',
  toolCallId: 'load-knowledge-1',
  state: 'output-available',
  input: {},
  output: {},
} satisfies ToolUIPart

const noop = () => {}

function inMessage(children: ReactNode) {
  return (
    <MessageProvider
      messageInfo={{ id: 'message-1', isLoading: false, state: 'idle' }}
      messageActions={{ onDelete: noop, onEdit: noop, onBranch: noop, onCancelEdit: noop }}
    >
      {children}
    </MessageProvider>
  )
}

function renderInMessage(children: ReactNode) {
  return customRender(inMessage(children))
}

describe('MessagePartSwitcher', () => {
  it('keeps consecutive generic tool parts as direct siblings', () => {
    const { container } = customRender(
      <>
        <MessagePartSwitcher part={reasoningPart} />
        <MessagePartSwitcher part={toolPart} />
      </>
    )

    const toolRows = container.querySelectorAll('.tool-item')
    expect(toolRows).toHaveLength(2)
    expect(toolRows[0].nextElementSibling).toBe(toolRows[1])
    expect(toolRows[0]).toHaveClass('max-w-3xl')
  })
})

describe('MessagePartToolGroup', () => {
  it('folds its tool rows behind a summary until expanded', async () => {
    const user = userEvent.setup()
    const { container } = renderInMessage(
      <MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={false} />
    )

    const trigger = screen.getByRole('button', { name: 'Worked across 2 tools' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(container.querySelectorAll('.tool-item')).toHaveLength(0)

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const toolRows = container.querySelectorAll('.tool-item')
    expect(toolRows).toHaveLength(2)
    expect(toolRows[0].nextElementSibling).toBe(toolRows[1])
    expect(screen.getByText('Reasoned')).toBeInTheDocument()
  })

  it('shows the latest tool call while running collapsed', async () => {
    const { rerender } = renderInMessage(
      <MessagePartToolGroup parts={[reasoningPart]} isRunning={true} />
    )
    const trigger = screen.getByRole('button', { name: 'Reasoned' })

    rerender(inMessage(<MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={true} />))

    await waitFor(() => expect(trigger).toHaveAccessibleName('Ran load_knowledge'))
  })

  it('can be expanded to show every tool call while running', async () => {
    const user = userEvent.setup()
    const { container } = renderInMessage(
      <MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={true} />
    )

    const trigger = screen.getByRole('button', { name: 'Ran load_knowledge' })
    await user.click(trigger)

    await waitFor(() => expect(trigger).toHaveAccessibleName('Working...'))
    const toolRows = container.querySelectorAll('.tool-item')
    expect(toolRows).toHaveLength(2)
    // Only the latest call is in progress
    expect(toolRows[0].querySelector('.shimmer')).toBeNull()
    expect(toolRows[1].querySelector('.shimmer')).toBeInTheDocument()
  })

  it('shimmers the summary only while running', async () => {
    const { rerender } = renderInMessage(
      <MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={true} />
    )
    const trigger = screen.getByRole('button', { name: 'Ran load_knowledge' })
    expect(trigger.querySelector('.shimmer')).toBeInTheDocument()

    rerender(
      inMessage(<MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={false} />)
    )

    await waitFor(() => expect(trigger.querySelector('.shimmer')).toBeNull())
  })

  it('summarizes the tool count once it stops running', async () => {
    const { rerender } = renderInMessage(
      <MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={true} />
    )
    const trigger = screen.getByRole('button', { name: 'Ran load_knowledge' })

    rerender(
      inMessage(<MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={false} />)
    )

    await waitFor(() => expect(trigger).toHaveAccessibleName('Worked across 2 tools'))
  })
})
