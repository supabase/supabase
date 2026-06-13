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
  QueryBlock: ({
    label,
    disabled,
    isExecuting,
  }: {
    label: string
    disabled?: boolean
    isExecuting?: boolean
  }) => (
    <div
      data-testid={`query-block-${label}`}
      data-disabled={String(disabled)}
      data-executing={String(isExecuting)}
    >
      {label}
    </div>
  ),
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

  it('shows approval controls for each pending SQL block in the last assistant message', async () => {
    const user = userEvent.setup()
    const approveFirst = vi.fn()
    const approveSecond = vi.fn()
    const denyFirst = vi.fn()
    const denySecond = vi.fn()

    render(
      <>
        <DisplayBlockRenderer
          messageId="message-id"
          toolCallId="tool-call-1"
          initialArgs={{
            sql: untrustedSql('select 1'),
            label: 'First Query',
          }}
          toolState="approval-requested"
          isLastMessage
          onApprove={approveFirst}
          onDeny={denyFirst}
        />
        <DisplayBlockRenderer
          messageId="message-id"
          toolCallId="tool-call-2"
          initialArgs={{
            sql: untrustedSql('select 2'),
            label: 'Second Query',
          }}
          toolState="approval-requested"
          isLastMessage
          onApprove={approveSecond}
          onDeny={denySecond}
        />
      </>
    )

    expect(screen.getByTestId('query-block-First Query')).toHaveAttribute('data-disabled', 'true')
    expect(screen.getByTestId('query-block-Second Query')).toHaveAttribute('data-disabled', 'true')
    expect(screen.getAllByText('Assistant wants to run this query')).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Run Query' })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Skip' })).toHaveLength(2)

    await user.click(screen.getAllByRole('button', { name: 'Run Query' })[1])
    await user.click(screen.getAllByRole('button', { name: 'Skip' })[0])

    expect(approveFirst).not.toHaveBeenCalled()
    expect(approveSecond).toHaveBeenCalledTimes(1)
    expect(denyFirst).toHaveBeenCalledTimes(1)
    expect(denySecond).not.toHaveBeenCalled()
  })

  it('does not show approval controls for pending SQL blocks outside the last assistant message', () => {
    render(
      <DisplayBlockRenderer
        messageId="message-id"
        toolCallId="tool-call-1"
        initialArgs={{
          sql: untrustedSql('select 1'),
          label: 'Historical Query',
        }}
        toolState="approval-requested"
        isLastMessage={false}
        onApprove={vi.fn()}
        onDeny={vi.fn()}
      />
    )

    expect(screen.getByTestId('query-block-Historical Query')).toHaveAttribute(
      'data-disabled',
      'false'
    )
    expect(screen.queryByText('Assistant wants to run this query')).not.toBeInTheDocument()
  })
})
