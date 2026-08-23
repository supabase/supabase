import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MessageProvider } from './Message.Context'
import { MessagePartQueryLogs } from './MessagePartQueryLogs'
import { customRender as render } from '@/tests/lib/custom-render'

vi.mock('./AssistantQueryCell', () => ({
  AssistantQueryCell: ({
    sql,
    initialResult,
  }: {
    sql: string
    initialResult?: { error?: Error }
  }) => (
    <div>
      <span>{sql}</span>
      <span>{initialResult?.error?.message}</span>
    </div>
  ),
}))

type QueryLogsToolPart = Parameters<typeof MessagePartQueryLogs>[0]['toolPart']

describe('MessagePartQueryLogs', () => {
  it('renders an output error using raw input when submitted input is unavailable', () => {
    const toolPart = {
      toolCallId: 'query-logs-1',
      state: 'output-error',
      input: undefined,
      rawInput: { sql: 'select count(*) from edge_logs' },
      errorText: 'Log query timed out',
    } as QueryLogsToolPart

    render(
      <MessageProvider
        messageInfo={{ id: 'message-1', isLoading: false, state: 'idle' }}
        messageActions={{
          onDelete: vi.fn(),
          onEdit: vi.fn(),
          onBranch: vi.fn(),
          onCancelEdit: vi.fn(),
        }}
      >
        <MessagePartQueryLogs toolPart={toolPart} />
      </MessageProvider>
    )

    expect(screen.getByText('select count(*) from edge_logs')).toBeInTheDocument()
    expect(screen.getByText('Log query timed out')).toBeInTheDocument()
  })
})
