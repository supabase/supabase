import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ToolUIPart } from 'ai'
import { type PropsWithChildren } from 'react'
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
  it('folds its tool rows behind a summary until expanded', async () => {
    const user = userEvent.setup()
    const { container } = customRender(
      <Provider>
        <MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={false} />
      </Provider>
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
    const { rerender } = customRender(
      <Provider isLoading>
        <MessagePartToolGroup parts={[reasoningPart]} isRunning={true} />
      </Provider>
    )
    const trigger = screen.getByRole('button', { name: 'Reasoned' })

    rerender(
      <Provider isLoading>
        <MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={true} />
      </Provider>
    )

    await waitFor(() => expect(trigger).toHaveAccessibleName('Ran load_knowledge'))
  })

  it('can be expanded to show every tool call while running', async () => {
    const user = userEvent.setup()
    const { container } = customRender(
      <Provider isLoading>
        <MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={true} />
      </Provider>
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

  it('moves the shimmer to each new tool call as it arrives', async () => {
    const user = userEvent.setup()
    const { container, rerender } = customRender(
      <Provider isLoading>
        <MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={true} />
      </Provider>
    )
    await user.click(screen.getByRole('button', { name: 'Ran load_knowledge' }))

    const nextReasoningPart = { ...reasoningPart, state: 'streaming' as const }
    rerender(
      <Provider isLoading>
        <MessagePartToolGroup
          parts={[reasoningPart, toolPart, nextReasoningPart]}
          isRunning={true}
        />
      </Provider>
    )

    const toolRows = container.querySelectorAll('.tool-item')
    expect(toolRows).toHaveLength(3)
    expect(toolRows[1].querySelector('.shimmer')).toBeNull()
    expect(toolRows[2].querySelector('.shimmer')).toBeInTheDocument()
  })

  it('shimmers the summary only while running', async () => {
    const { rerender } = customRender(
      <Provider isLoading>
        <MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={true} />
      </Provider>
    )
    const trigger = screen.getByRole('button', { name: 'Ran load_knowledge' })
    expect(trigger.querySelector('.shimmer')).toBeInTheDocument()

    rerender(
      <Provider>
        <MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={false} />
      </Provider>
    )

    await waitFor(() => expect(trigger.querySelector('.shimmer')).toBeNull())
  })

  it('summarizes the tool count once it stops running', async () => {
    const { rerender } = customRender(
      <Provider isLoading>
        <MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={true} />
      </Provider>
    )
    const trigger = screen.getByRole('button', { name: 'Ran load_knowledge' })

    rerender(
      <Provider>
        <MessagePartToolGroup parts={[reasoningPart, toolPart]} isRunning={false} />
      </Provider>
    )

    await waitFor(() => expect(trigger).toHaveAccessibleName('Worked across 2 tools'))
  })
})
