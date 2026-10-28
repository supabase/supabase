import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ToolUIPart } from 'ai'
import { type PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MessageProvider } from './Message.Context'
import { MessagePartSwitcher, MessagePartToolGroup } from './Message.Parts'
import type { CompactPart } from './Message.Parts.utils'
import { customRender } from '@/tests/lib/custom-render'

type MessagePart = Parameters<typeof MessagePartSwitcher>[0]['part']

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

describe('MessagePartSwitcher', () => {
  it('keeps consecutive generic tool parts as direct siblings', () => {
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
  const reasoning = (text = 'Looking at the schema'): CompactPart => ({
    type: 'reasoning',
    state: 'done',
    text,
  })
  const streamingReasoning: CompactPart = { type: 'reasoning', state: 'streaming', text: '' }
  const tool: CompactPart = {
    type: 'tool-load_knowledge',
    toolCallId: 'knowledge-1',
    state: 'output-available',
    input: {},
    output: {},
  }
  const runningTool: CompactPart = {
    type: 'tool-load_knowledge',
    toolCallId: 'knowledge-1',
    state: 'input-available',
    input: {},
  }

  afterEach(() => vi.useRealTimers())

  // A group only runs while its message streams
  const toolGroup = (parts: CompactPart[], isRunning: boolean) => (
    <Provider isLoading={isRunning}>
      <MessagePartToolGroup parts={parts} isRunning={isRunning} />
    </Provider>
  )

  it('folds its rows behind a summary until expanded', async () => {
    const { container } = customRender(toolGroup([reasoning(), tool], false))
    expect(container.querySelectorAll('.tool-item')).toHaveLength(0)

    await userEvent.click(screen.getByRole('button', { name: 'Read up' }))

    expect(container.querySelectorAll('.tool-item')).toHaveLength(2)
    expect(screen.getByText('Reasoned')).toBeInTheDocument()
  })

  it('hides finished reasoning rows with nothing to expand', async () => {
    const { container } = customRender(toolGroup([reasoning(''), tool], false))
    await userEvent.click(screen.getByRole('button', { name: 'Read up' }))
    expect(container.querySelectorAll('.tool-item')).toHaveLength(1)
  })

  it('holds each running header long enough to read', () => {
    vi.useFakeTimers()
    const { rerender } = customRender(toolGroup([streamingReasoning], true))
    const trigger = screen.getByRole('button', { name: 'Thinking...' })

    rerender(toolGroup([reasoning(), runningTool], true))
    expect(trigger).toHaveAccessibleName('Thinking...')
    act(() => vi.advanceTimersByTime(1000))
    expect(trigger).toHaveAccessibleName('Reading up...')

    // The call finished right away, but its label stays up before going back to thinking
    rerender(toolGroup([reasoning(), tool], true))
    expect(trigger).toHaveAccessibleName('Reading up...')
    act(() => vi.advanceTimersByTime(1000))
    expect(trigger).toHaveAccessibleName('Thinking...')

    // The summary replaces the header as soon as the group stops
    rerender(toolGroup([reasoning(), tool], false))
    expect(trigger).toHaveAccessibleName('Read up')
    expect(trigger.querySelector('.shimmer')).toBeNull()
  })

  it('shimmers every row still in progress', async () => {
    const { container, rerender } = customRender(
      toolGroup([reasoning(), runningTool, tool, runningTool], true)
    )
    await userEvent.click(screen.getByRole('button', { name: 'Reading up...' }))

    const shimmeringRows = () =>
      [...container.querySelectorAll('.tool-item')].map((row) => !!row.querySelector('.shimmer'))
    expect(shimmeringRows()).toEqual([false, true, false, true])

    rerender(toolGroup([reasoning(), tool, tool, tool, streamingReasoning], true))
    expect(shimmeringRows()).toEqual([false, false, false, false, true])
  })
})
