import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ToolUIPart } from 'ai'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

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

const executingToolPart = {
  type: 'tool-load_knowledge',
  toolCallId: 'load-knowledge-1',
  state: 'input-available',
  input: {},
} satisfies ToolUIPart

const streamingReasoningPart = {
  ...reasoningPart,
  state: 'streaming',
} satisfies Extract<MessagePart, { type: 'reasoning' }>

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

  it('marks an unfinished call as stopped outside a running group', () => {
    customRender(<MessagePartSwitcher part={executingToolPart} />)
    expect(screen.getByText('Stopped reading up')).toBeInTheDocument()
  })
})

describe('MessagePartToolGroup', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('folds its tool rows behind a summary until expanded', async () => {
    const user = userEvent.setup()
    const { container } = renderInMessage(
      <MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={false} />
    )

    const trigger = screen.getByRole('button', { name: 'Read up' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(container.querySelectorAll('.tool-item')).toHaveLength(0)

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const toolRows = container.querySelectorAll('.tool-item')
    expect(toolRows).toHaveLength(2)
    expect(toolRows[0].nextElementSibling).toBe(toolRows[1])
    expect(screen.getByText('Reasoned')).toBeInTheDocument()
  })

  it('shows a tool call in the header while it executes', () => {
    renderInMessage(
      <MessagePartToolGroup parts={[reasoningPart, executingToolPart]} isRunning={true} />
    )
    expect(screen.getByRole('button', { name: 'Reading up...' })).toBeInTheDocument()
  })

  it('holds each running header long enough to read', () => {
    vi.useFakeTimers()
    const { rerender } = renderInMessage(
      <MessagePartToolGroup parts={[streamingReasoningPart]} isRunning={true} />
    )
    const trigger = screen.getByRole('button', { name: 'Thinking...' })

    rerender(
      inMessage(
        <MessagePartToolGroup parts={[reasoningPart, executingToolPart]} isRunning={true} />
      )
    )
    expect(trigger).toHaveAccessibleName('Thinking...')
    act(() => vi.advanceTimersByTime(1000))
    expect(trigger).toHaveAccessibleName('Reading up...')

    // The call finished right away, but its label stays up before the header goes back to thinking
    rerender(inMessage(<MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={true} />))
    expect(trigger).toHaveAccessibleName('Reading up...')
    act(() => vi.advanceTimersByTime(1000))
    expect(trigger).toHaveAccessibleName('Thinking...')
  })

  it('can be expanded to show every tool call while running', async () => {
    const user = userEvent.setup()
    const { container } = renderInMessage(
      <MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={true} />
    )

    const trigger = screen.getByRole('button', { name: 'Thinking...' })
    await user.click(trigger)

    const toolRows = container.querySelectorAll('.tool-item')
    expect(toolRows).toHaveLength(2)
    // Only the latest call is in progress
    expect(toolRows[0].querySelector('.shimmer')).toBeNull()
    expect(toolRows[1].querySelector('.shimmer')).toBeInTheDocument()
  })

  it('moves the shimmer to each new tool call as it arrives', async () => {
    const user = userEvent.setup()
    const { container, rerender } = renderInMessage(
      <MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={true} />
    )
    await user.click(screen.getByRole('button', { name: 'Thinking...' }))

    rerender(
      inMessage(
        <MessagePartToolGroup
          parts={[reasoningPart, toolPart, streamingReasoningPart]}
          isRunning={true}
        />
      )
    )

    const toolRows = container.querySelectorAll('.tool-item')
    expect(toolRows).toHaveLength(3)
    expect(toolRows[1].querySelector('.shimmer')).toBeNull()
    expect(toolRows[2].querySelector('.shimmer')).toBeInTheDocument()
  })

  it('hides finished reasoning rows with nothing to expand', async () => {
    const user = userEvent.setup()
    const emptyReasoningPart = { ...reasoningPart, text: '' }
    const { container } = renderInMessage(
      <MessagePartToolGroup parts={[emptyReasoningPart, toolPart]} isRunning={false} />
    )

    await user.click(screen.getByRole('button', { name: 'Read up' }))

    expect(container.querySelectorAll('.tool-item')).toHaveLength(1)
    expect(screen.queryByText('Reasoned')).not.toBeInTheDocument()
  })

  it('shimmers the header only while running', async () => {
    const { rerender } = renderInMessage(
      <MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={true} />
    )
    const trigger = screen.getByRole('button', { name: 'Thinking...' })
    expect(trigger.querySelector('.shimmer')).toBeInTheDocument()

    rerender(
      inMessage(<MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={false} />)
    )

    await waitFor(() => expect(trigger.querySelector('.shimmer')).toBeNull())
  })

  it('summarizes what it did as soon as it stops running', () => {
    const { rerender } = renderInMessage(
      <MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={true} />
    )
    const trigger = screen.getByRole('button', { name: 'Thinking...' })

    rerender(
      inMessage(<MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={false} />)
    )

    expect(trigger).toHaveAccessibleName('Read up')
  })
})
