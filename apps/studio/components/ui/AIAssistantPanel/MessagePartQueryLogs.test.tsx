import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MessageProvider } from './Message.Context'
import { MessagePartQueryLogs } from './MessagePartQueryLogs'
import { customRender as render } from '@/tests/lib/custom-render'

vi.mock('@/components/interfaces/Explorer/QueryEditor', () => ({
  QueryEditor: ({
    query,
    result,
  }: {
    query: { uncheckedSql: string }
    result?: { error?: { message?: string } }
  }) => (
    <div data-testid="query-editor">
      <span>{query.uncheckedSql}</span>
      <span>{result?.error?.message}</span>
    </div>
  ),
}))
vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))
vi.mock('@/state/role-impersonation-state', () => ({
  useLocalRoleImpersonationState: () => ({}),
}))

type QueryLogsToolPart = Parameters<typeof MessagePartQueryLogs>[0]['toolPart']

const messageInfo = {
  id: 'message-1',
  isLoading: false,
  state: 'idle' as const,
}

const messageActions = {
  onDelete: vi.fn(),
  onEdit: vi.fn(),
  onBranch: vi.fn(),
  onCancelEdit: vi.fn(),
}

function renderPart(toolPart: Parameters<typeof MessagePartQueryLogs>[0]['toolPart']) {
  return render(
    <MessageProvider messageInfo={messageInfo} messageActions={messageActions}>
      <MessagePartQueryLogs toolPart={toolPart} />
    </MessageProvider>
  )
}

describe('MessagePartQueryLogs', () => {
  it('renders an output error using raw input when submitted input is unavailable', () => {
    renderPart({
      toolCallId: 'query-logs-1',
      state: 'output-error',
      input: undefined,
      rawInput: { sql: 'select count(*) from edge_logs' },
      errorText: 'Log query timed out',
    } as QueryLogsToolPart)

    expect(screen.getByText('select count(*) from edge_logs')).toBeInTheDocument()
    expect(screen.getByText('Log query timed out')).toBeInTheDocument()
  })

  it('uses logs-specific copy for a rendered tool error', () => {
    renderPart({
      toolCallId: 'logs-1',
      state: 'output-error',
      input: { sql: 'select event_message from edge_logs' },
      output: undefined,
      errorText: 'Analytics request failed',
    })

    expect(screen.getByText('Failed to query logs')).toBeInTheDocument()
    expect(screen.queryByText('Failed to execute SQL')).not.toBeInTheDocument()
  })

  it('shows an explicit failure when errored input cannot be parsed', () => {
    renderPart({
      toolCallId: 'logs-2',
      state: 'output-error',
      input: { invalid: true },
      output: undefined,
      errorText: 'Analytics request failed',
    })

    expect(screen.getByText('Failed to query logs.')).toBeInTheDocument()
  })
})
