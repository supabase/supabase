import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ToolUIPart } from 'ai'
import type { PropsWithChildren } from 'react'
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

function Provider({
  children,
  isLoading = false,
  isLastMessage = true,
}: PropsWithChildren<{ isLoading?: boolean; isLastMessage?: boolean }>) {
  return (
    <MessageProvider
      messageInfo={{ id: 'message-1', isLoading, isLastMessage, state: 'idle' }}
      messageActions={{
        onDelete: () => {},
        onEdit: () => {},
        onBranch: () => {},
        onCancelEdit: () => {},
      }}
    >
      {children}
    </MessageProvider>
  )
}

function toolGroup(parts: MessagePart[], isRunning: boolean) {
  // A group only runs while its message streams
  return (
    <Provider isLoading={isRunning}>
      <MessagePartToolGroup parts={parts} isRunning={isRunning} />
    </Provider>
  )
}

describe('MessagePartSwitcher', () => {
  it('keeps consecutive generic tool parts as direct siblings', () => {
    const { container } = customRender(
      <Provider>
        <MessagePartSwitcher part={reasoningPart} />
        <MessagePartSwitcher part={toolPart} />
      </Provider>
    )

    const toolRows = container.querySelectorAll('.tool-item')
    expect(toolRows).toHaveLength(2)
    expect(toolRows[0].nextElementSibling).toBe(toolRows[1])
    expect(toolRows[0]).toHaveClass('max-w-3xl')
  })

  it.each([
    { type: 'reasoning', state: 'streaming', text: 'Still thinking' },
    { type: 'tool-execute_sql', state: 'input-streaming', toolCallId: 'sql-1' },
    { type: 'tool-create_notebook', state: 'input-streaming', toolCallId: 'notebook-1' },
    { type: 'tool-update_notebook', state: 'input-streaming', toolCallId: 'notebook-2' },
    { type: 'tool-query_logs', state: 'input-available', toolCallId: 'logs-1', input: {} },
  ] satisfies MessagePart[])('stops the $type indicator when the request ends', (part) => {
    const { container, getByText, rerender } = customRender(
      <Provider isLoading>
        <MessagePartSwitcher part={part} />
      </Provider>
    )
    expect(container.querySelector('.animate-spin')).not.toBeNull()

    rerender(
      <Provider>
        <MessagePartSwitcher part={part} />
      </Provider>
    )
    expect(getByText('Response interrupted')).toBeInTheDocument()
    expect(container.querySelector('.animate-spin')).toBeNull()
  })

  it.each([
    { type: 'tool-search_docs', state: 'input-available', toolCallId: 'docs-1', input: {} },
    {
      type: 'dynamic-tool',
      toolName: 'list_tables',
      state: 'input-available',
      toolCallId: 'mcp-1',
      input: {},
    },
  ] satisfies MessagePart[])(
    'marks a $type call that never returned as interrupted once the request ends',
    (part) => {
      const { queryByText, getByText, rerender } = customRender(
        <Provider isLoading>
          <MessagePartSwitcher part={part} />
        </Provider>
      )
      expect(queryByText('Response interrupted')).toBeNull()

      rerender(
        <Provider>
          <MessagePartSwitcher part={part} />
        </Provider>
      )
      expect(getByText('Response interrupted')).toBeInTheDocument()
    }
  )

  it('does not restart an interrupted indicator when another message is streaming', () => {
    const { container, getByText } = customRender(
      <Provider isLoading isLastMessage={false}>
        <MessagePartSwitcher part={{ type: 'reasoning', state: 'streaming', text: '' }} />
      </Provider>
    )
    expect(getByText('Response interrupted')).toBeInTheDocument()
    expect(container.querySelector('.animate-spin')).toBeNull()
  })
})

describe('MessagePartToolGroup', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('folds its tool rows behind a summary until expanded', async () => {
    const user = userEvent.setup()
    const { container } = customRender(toolGroup([reasoningPart, toolPart], false))

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
    customRender(toolGroup([reasoningPart, executingToolPart], true))
    expect(screen.getByRole('button', { name: 'Reading up...' })).toBeInTheDocument()
  })

  it('holds each running header long enough to read', () => {
    vi.useFakeTimers()
    const { rerender } = customRender(toolGroup([streamingReasoningPart], true))
    const trigger = screen.getByRole('button', { name: 'Thinking...' })

    rerender(toolGroup([reasoningPart, executingToolPart], true))
    expect(trigger).toHaveAccessibleName('Thinking...')
    act(() => vi.advanceTimersByTime(1000))
    expect(trigger).toHaveAccessibleName('Reading up...')

    // The call finished right away, but its label stays up before the header goes back to thinking
    rerender(toolGroup([reasoningPart, toolPart], true))
    expect(trigger).toHaveAccessibleName('Reading up...')
    act(() => vi.advanceTimersByTime(1000))
    expect(trigger).toHaveAccessibleName('Thinking...')
  })

  it('can be expanded to show every tool call while running', async () => {
    const user = userEvent.setup()
    const { container } = customRender(toolGroup([reasoningPart, toolPart], true))

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
    const { container, rerender } = customRender(toolGroup([reasoningPart, toolPart], true))
    await user.click(screen.getByRole('button', { name: 'Thinking...' }))

    rerender(toolGroup([reasoningPart, toolPart, streamingReasoningPart], true))

    const toolRows = container.querySelectorAll('.tool-item')
    expect(toolRows).toHaveLength(3)
    expect(toolRows[1].querySelector('.shimmer')).toBeNull()
    expect(toolRows[2].querySelector('.shimmer')).toBeInTheDocument()
  })

  it('hides finished reasoning rows with nothing to expand', async () => {
    const user = userEvent.setup()
    const emptyReasoningPart = { ...reasoningPart, text: '' }
    const { container } = customRender(toolGroup([emptyReasoningPart, toolPart], false))

    await user.click(screen.getByRole('button', { name: 'Read up' }))

    expect(container.querySelectorAll('.tool-item')).toHaveLength(1)
    expect(screen.queryByText('Reasoned')).not.toBeInTheDocument()
  })

  it('shimmers the header only while running', async () => {
    const { rerender } = customRender(toolGroup([reasoningPart, toolPart], true))
    const trigger = screen.getByRole('button', { name: 'Thinking...' })
    expect(trigger.querySelector('.shimmer')).toBeInTheDocument()

    rerender(toolGroup([reasoningPart, toolPart], false))

    await waitFor(() => expect(trigger.querySelector('.shimmer')).toBeNull())
  })

  it('summarizes what it did as soon as it stops running', () => {
    const { rerender } = customRender(toolGroup([reasoningPart, toolPart], true))
    const trigger = screen.getByRole('button', { name: 'Thinking...' })

    rerender(toolGroup([reasoningPart, toolPart], false))

    expect(trigger).toHaveAccessibleName('Read up')
  })
})
