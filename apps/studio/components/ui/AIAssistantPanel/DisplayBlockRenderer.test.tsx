import { untrustedSql } from '@supabase/pg-meta'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DisplayBlockRenderer } from './DisplayBlockRenderer'
import { render } from '@/tests/helpers'

const { mockExecuteSqlMutation, mockTrack, mockUseParams } = vi.hoisted(() => ({
  mockExecuteSqlMutation: vi.fn(),
  mockTrack: vi.fn(),
  mockUseParams: vi.fn(),
}))

vi.mock('common', async () => {
  const actual = await vi.importActual<typeof import('common')>('common')

  return {
    ...actual,
    useParams: mockUseParams,
  }
})

vi.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/project/[ref]' }),
}))

vi.mock('@/data/read-replicas/replicas-query', () => ({
  usePrimaryDatabase: () => ({
    database: {
      connection_string_read_only: 'read-only-connection-string',
      connectionString: 'postgres-connection-string',
    },
  }),
}))

vi.mock('@/data/sql/execute-sql-mutation', () => ({
  useExecuteSqlMutation: mockExecuteSqlMutation,
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: false }),
}))

vi.mock('@/lib/profile', () => ({
  useProfile: () => ({ profile: { id: 'profile-id' } }),
}))

vi.mock('@/lib/telemetry/track', () => ({
  useTrack: () => mockTrack,
}))

vi.mock('../QueryBlock/QueryBlock', () => ({
  DEFAULT_CHART_CONFIG: {
    type: 'bar',
    cumulative: false,
    xKey: '',
    yKey: '',
    showLabels: false,
    showGrid: false,
    logScale: false,
    view: 'table',
  },
  QueryBlock: ({ label }: { label: string }) => <div>{label}</div>,
}))

describe('DisplayBlockRenderer', () => {
  beforeEach(() => {
    mockExecuteSqlMutation.mockReturnValue({
      mutate: vi.fn(),
      error: null,
      isPending: false,
    })
    mockTrack.mockReset()
    mockUseParams.mockReturnValue({ ref: 'project-ref' })
  })

  it('shows working approval controls for a pending SQL block even when it is not the last rendered part', async () => {
    // Regression test: when the assistant proposes multiple SQL queries in the same
    // turn, only the first stays pending (the rest get auto-denied elsewhere), but the
    // pending one is not necessarily the last part in the message.
    const user = userEvent.setup()
    const onApprove = vi.fn()
    const onDeny = vi.fn()

    render(
      <>
        <DisplayBlockRenderer
          messageId="message-id"
          toolCallId="tool-call-1"
          initialArgs={{ sql: untrustedSql('select 1'), label: 'First Query' }}
          toolState="approval-requested"
          isLastMessage
          onApprove={onApprove}
          onDeny={onDeny}
        />
        <DisplayBlockRenderer
          messageId="message-id"
          toolCallId="tool-call-2"
          initialArgs={{ sql: untrustedSql('select 2'), label: 'Second Query' }}
          toolState="approval-responded"
          toolApprovalRespondedApproved={false}
          isLastMessage
        />
      </>
    )

    expect(screen.getByRole('button', { name: 'Run Query' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Run Query' }))

    expect(onApprove).toHaveBeenCalledTimes(1)
    expect(onDeny).not.toHaveBeenCalled()
  })

  it('does not show approval controls for pending SQL blocks outside the last assistant message', () => {
    render(
      <DisplayBlockRenderer
        messageId="message-id"
        toolCallId="tool-call-1"
        initialArgs={{ sql: untrustedSql('select 1'), label: 'Historical Query' }}
        toolState="approval-requested"
        isLastMessage={false}
        onApprove={vi.fn()}
        onDeny={vi.fn()}
      />
    )

    expect(screen.queryByText('Assistant wants to run this query')).not.toBeInTheDocument()
  })
})
