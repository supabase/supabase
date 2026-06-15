import { screen } from '@testing-library/dom'
import { describe, expect, it, vi } from 'vitest'

import { render } from '@/tests/helpers'
import { PreviousRunsTab } from './PreviousRunsTab'

const TEST_START = '2026-06-15T09:25:00.000Z'
const TEST_END = '2026-06-15T09:25:05.000Z'

// Replace the virtualized DataGrid with a plain renderer so renderCell
// functions are exercised without needing real DOM dimensions.
vi.mock('react-data-grid', () => ({
  default: ({ rows, columns }: any) => (
    <div>
      {rows.map((row: any, rowIdx: number) =>
        columns.map((col: any) => (
          <div key={`${rowIdx}-${String(col.key)}`}>{col.renderCell?.({ row })}</div>
        ))
      )}
    </div>
  ),
  Row: ({ children }: any) => <>{children}</>,
}))

vi.mock('common', () => ({
  useParams: () => ({ childId: '1' }),
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({
    data: { ref: 'test-ref', connectionString: 'test-conn' },
  }),
}))

vi.mock('@/data/database-cron-jobs/database-cron-jobs-runs-infinite-query', () => ({
  useCronJobRunsInfiniteQuery: () => ({
    data: {
      pages: [
        [
          {
            runid: 1,
            job_pid: 123,
            jobid: 1,
            start_time: TEST_START,
            end_time: TEST_END,
            return_message: null,
            status: 'succeeded',
          },
        ],
      ],
    },
    isPending: false,
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
  }),
}))

vi.mock('@/hooks/misc/useInfiniteScroll', () => ({
  useInfiniteScroll: () => vi.fn(),
}))

describe('PreviousRunsTab timestamp display', () => {
  it('renders start_time and end_time columns in UTC', () => {
    render(<PreviousRunsTab />)
    // Both start_time and end_time should show timestamps ending in (UTC)
    const utcLabels = screen.getAllByText(/\(UTC\)/)
    expect(utcLabels.length).toBeGreaterThanOrEqual(2)
  })
})
