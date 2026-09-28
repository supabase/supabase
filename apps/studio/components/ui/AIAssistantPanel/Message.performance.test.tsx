import { fireEvent, render, screen } from '@testing-library/react'
import type { UIMessage } from 'ai'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Message } from './Message'

const { renderQuery, renderFunction, renderMarkdown } = vi.hoisted(() => ({
  renderQuery: vi.fn(),
  renderFunction: vi.fn(),
  renderMarkdown: vi.fn(),
}))

// Keep the message/context/part pipeline real, substituting stateful probes for the
// expensive leaves so we can detect both extra renders and lost local state.
vi.mock('./AssistantQueryCell', () => ({
  AssistantQueryCell: (props: { initialResult?: { rows: unknown[] }; onApprove?: () => void }) => {
    renderQuery(props)
    const [runs, setRuns] = useState(0)
    return (
      <div>
        <button tabIndex={0} onClick={() => setRuns((count) => count + 1)}>
          Run count: {runs}
        </button>
        <button tabIndex={0} onClick={props.onApprove}>
          Approve query
        </button>
        <output>{JSON.stringify(props.initialResult?.rows)}</output>
      </div>
    )
  },
}))

vi.mock('./EdgeFunctionRenderer', () => ({
  EdgeFunctionRenderer: (props: { code: string }) => {
    renderFunction(props)
    return <pre>{props.code}</pre>
  },
}))

vi.mock('./MessageMarkdown', () => ({
  MessageMarkdown: ({ children }: { children: string }) => {
    renderMarkdown(children)
    return <p>{children}</p>
  },
}))

vi.mock('./Message.Actions', () => ({ MessageActions: () => null }))

const initialMessage: UIMessage = {
  id: 'assistant-1',
  role: 'assistant',
  parts: [
    {
      type: 'tool-execute_sql',
      toolCallId: 'query-1',
      state: 'approval-requested',
      approval: { id: 'approval-1' },
      input: { sql: 'select 1', label: 'Query', view: 'table' },
    },
    {
      type: 'tool-deploy_edge_function',
      toolCallId: 'function-1',
      state: 'input-available',
      input: {
        code: 'Deno.serve(() => new Response("hello"))',
        label: 'Function',
        functionName: 'hello',
      },
    },
    { type: 'text', text: 'Working' },
  ],
}

const callbacks = {
  onDelete: vi.fn(),
  onEdit: vi.fn(),
  onBranch: vi.fn(),
  onCancelEdit: vi.fn(),
  addToolApprovalResponse: vi.fn(),
}

function FeedMessage({
  message = initialMessage,
  isLoading = true,
  addToolApprovalResponse = callbacks.addToolApprovalResponse,
}: {
  message?: UIMessage
  isLoading?: boolean
  addToolApprovalResponse?: typeof callbacks.addToolApprovalResponse
}) {
  return (
    <Message
      {...callbacks}
      id={message.id}
      message={message}
      isLoading={isLoading}
      isAfterEditedMessage={false}
      isBeingEdited={false}
      addToolApprovalResponse={addToolApprovalResponse}
    />
  )
}

describe('assistant feed rendering', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not rerender unchanged history when the parent renders', () => {
    const { rerender } = render(<FeedMessage />)
    const counts = [
      renderQuery.mock.calls.length,
      renderFunction.mock.calls.length,
      renderMarkdown.mock.calls.length,
    ]

    rerender(<FeedMessage />)

    expect([
      renderQuery.mock.calls.length,
      renderFunction.mock.calls.length,
      renderMarkdown.mock.calls.length,
    ]).toEqual(counts)
  })

  it('updates streamed text without rerendering cloned tools or losing their local state', () => {
    const { rerender } = render(<FeedMessage />)
    fireEvent.click(screen.getByRole('button', { name: 'Run count: 0' }))
    const queryRenders = renderQuery.mock.calls.length
    const functionRenders = renderFunction.mock.calls.length

    const updated = structuredClone(initialMessage)
    updated.parts[2] = { type: 'text', text: 'Working on the next step' }
    rerender(<FeedMessage message={updated} />)

    expect(screen.getByText('Working on the next step')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Run count: 1' })).toBeInTheDocument()
    expect(renderQuery).toHaveBeenCalledTimes(queryRenders)
    expect(renderFunction).toHaveBeenCalledTimes(functionRenders)
  })

  it('updates tool output and code when their content changes', () => {
    const { rerender } = render(<FeedMessage />)
    const updated = structuredClone(initialMessage)
    updated.parts[0] = {
      type: 'tool-execute_sql',
      toolCallId: 'query-1',
      state: 'output-available',
      input: { sql: 'select 1', label: 'Query', view: 'table' },
      output: [{ value: 1 }],
    }
    updated.parts[1] = {
      type: 'tool-deploy_edge_function',
      toolCallId: 'function-1',
      state: 'input-available',
      input: { code: 'updated code', label: 'Function', functionName: 'hello' },
    }
    rerender(<FeedMessage message={updated} />)

    expect(screen.getByText('[{"value":1}]')).toBeInTheDocument()
    expect(screen.getByText('updated code')).toBeInTheDocument()
  })

  it('uses the latest approval callback even when the tool part is unchanged', () => {
    const { rerender } = render(<FeedMessage />)
    const approve = vi.fn()
    rerender(<FeedMessage addToolApprovalResponse={approve} />)
    fireEvent.click(screen.getByRole('button', { name: 'Approve query' }))

    expect(approve).toHaveBeenCalledWith({ id: 'approval-1', approved: true })
    expect(callbacks.addToolApprovalResponse).not.toHaveBeenCalled()
  })

  it('retains query state when streaming completes', () => {
    const { rerender } = render(<FeedMessage />)
    fireEvent.click(screen.getByRole('button', { name: 'Run count: 0' }))
    rerender(<FeedMessage isLoading={false} />)
    expect(screen.getByRole('button', { name: 'Run count: 1' })).toBeInTheDocument()
  })

  it('finishes reasoning when the SDK mutates the first streamed part before publishing a snapshot', () => {
    const reasoning = {
      type: 'reasoning' as const,
      text: '',
      state: 'streaming' as 'streaming' | 'done',
    }
    const message: UIMessage = { id: 'reasoning-1', role: 'assistant', parts: [reasoning] }
    const { rerender } = render(<FeedMessage message={message} />)
    expect(screen.getByText('Thinking...')).toBeInTheDocument()

    // Chat.pushMessage exposes the initial object; subsequent replaceMessage calls clone it.
    reasoning.state = 'done'
    rerender(<FeedMessage message={structuredClone(message)} isLoading={false} />)

    expect(screen.queryByText('Thinking...')).not.toBeInTheDocument()
    expect(screen.getByText('Reasoned')).toBeInTheDocument()
  })

  it('updates text when the SDK mutates the first streamed part', () => {
    const text = { type: 'text' as const, text: 'First token', state: 'streaming' as const }
    const message: UIMessage = { id: 'text-1', role: 'assistant', parts: [text] }
    const { rerender } = render(<FeedMessage message={message} />)

    text.text = 'First token and the rest of the response'
    rerender(<FeedMessage message={structuredClone(message)} />)

    expect(screen.getByText(text.text)).toBeInTheDocument()
  })

  it('updates a tool when its initial input-streaming part is mutated to a completed result', () => {
    const tool = {
      type: 'tool-execute_sql' as const,
      toolCallId: 'query-1',
      state: 'input-streaming' as const,
    }
    const message: UIMessage = { id: 'tool-1', role: 'assistant', parts: [tool] }
    const { rerender } = render(<FeedMessage message={message} />)
    expect(screen.getByText('Writing SQL...')).toBeInTheDocument()

    Object.assign(tool, {
      state: 'output-available',
      input: { sql: 'select 1' },
      output: [{ value: 1 }],
    })
    rerender(<FeedMessage message={structuredClone(message)} isLoading={false} />)

    expect(screen.queryByText('Writing SQL...')).not.toBeInTheDocument()
    expect(screen.getByText('[{"value":1}]')).toBeInTheDocument()
  })
})
