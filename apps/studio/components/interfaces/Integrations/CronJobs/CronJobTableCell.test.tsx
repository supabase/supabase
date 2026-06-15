import { screen } from '@testing-library/dom'
import { describe, expect, it, vi } from 'vitest'

import { render } from '@/tests/helpers'
import { CronJobTableCell } from './CronJobTableCell'

vi.mock('@/data/database-cron-jobs/database-cron-job-run-mutation', () => ({
  useDatabaseCronJobRunCommandMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/data/database-cron-jobs/database-cron-jobs-toggle-mutation', () => ({
  useDatabaseCronJobToggleMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({ data: { ref: 'test-ref' } }),
}))

vi.mock('nuqs', () => ({
  parseAsString: { withDefault: () => null },
  useQueryState: () => ['', vi.fn()],
}))

const TEST_TIMESTAMP = '2026-06-15T09:25:00.000Z'

const baseRow = {
  jobid: 1,
  jobname: 'test-job',
  schedule: '*/5 * * * *',
  latest_run: TEST_TIMESTAMP,
  status: 'succeeded',
  active: true,
  command: 'SELECT 1',
}

describe('CronJobTableCell timestamp display', () => {
  it('renders latest_run in UTC', () => {
    render(
      <CronJobTableCell
        col={{ id: 'latest_run', name: 'Last run' }}
        row={baseRow}
        onSelectEdit={vi.fn()}
        onSelectDelete={vi.fn()}
      />
    )
    expect(screen.getByText(/\(UTC\)/)).toBeInTheDocument()
  })

  it('renders next_run in UTC', () => {
    render(
      <CronJobTableCell
        col={{ id: 'next_run', name: 'Next run' }}
        row={baseRow}
        onSelectEdit={vi.fn()}
        onSelectDelete={vi.fn()}
      />
    )
    expect(screen.getByText(/\(UTC\)/)).toBeInTheDocument()
  })

  it('shows a dash when latest_run is absent', () => {
    const { container } = render(
      <CronJobTableCell
        col={{ id: 'latest_run', name: 'Last run' }}
        row={{ ...baseRow, latest_run: undefined }}
        onSelectEdit={vi.fn()}
        onSelectDelete={vi.fn()}
      />
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(screen.queryByText(/\(UTC\)/)).toBeNull()
  })
})
