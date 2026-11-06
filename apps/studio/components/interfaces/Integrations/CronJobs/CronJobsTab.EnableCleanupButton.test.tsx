import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { EnableCleanupButton } from './CronJobsTab.EnableCleanupButton'
import { ProjectContextProvider } from '@/components/layouts/ProjectLayout/ProjectContext'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

mockAnimationsApi()

const cleanupJobRow = {
  jobid: 1,
  jobname: 'delete-job-run-details',
  schedule: '0 12 * * *',
  command: `DELETE FROM cron.job_run_details WHERE end_time < now() - interval '7 days';`,
  active: true,
}

// Mutable state for the pg-meta mock, reset per test. Scheduling flips
// cleanupJobExists so the subsequent existence refetch sees the new job,
// mirroring the real invalidation flow.
let cleanupJobExists = false
let lookupCount = 0
let scheduleQueries: string[] = []

const renderButton = (onScheduled = vi.fn()) => {
  customRender(
    <ProjectContextProvider projectRef="default">
      <EnableCleanupButton onScheduled={onScheduled} />
    </ProjectContextProvider>
  )
  return onScheduled
}

describe('EnableCleanupButton', () => {
  beforeEach(() => {
    cleanupJobExists = false
    lookupCount = 0
    scheduleQueries = []

    // useSelectedProjectQuery -> useParams
    routerMock.setCurrentUrl('/project/default/integrations/cron/jobs')
    // useSelectedProjectQuery
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      // @ts-expect-error partial project shape
      response: {
        cloud_provider: 'localhost',
        id: 1,
        inserted_at: '2021-08-02T06:40:40.646Z',
        name: 'Default Project',
        organization_id: 1,
        ref: 'default',
        region: 'local',
        status: 'ACTIVE_HEALTHY',
      },
    })
    // The existence lookup (useCronJobQuery by name) and the schedule mutation
    // both go through the pg-meta query endpoint with different SQL
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const { query } = (await request.json()) as { query: string }

        if (query.includes('cron.schedule')) {
          scheduleQueries.push(query)
          cleanupJobExists = true
          return HttpResponse.json([{ schedule: 1 }])
        }

        // jobname lookup
        lookupCount += 1
        return HttpResponse.json(cleanupJobExists ? [cleanupJobRow] : [])
      },
    })
  })

  test('shows the button once the cleanup job is confirmed missing', async () => {
    renderButton()

    expect(await screen.findByRole('button', { name: 'Enable cleanup' })).toBeInTheDocument()
  })

  test('hides the button when the cleanup job already exists', async () => {
    cleanupJobExists = true
    renderButton()

    await waitFor(() => expect(lookupCount).toBeGreaterThan(0))
    expect(screen.queryByRole('button', { name: 'Enable cleanup' })).not.toBeInTheDocument()
  })

  test('schedules the cleanup job with the selected retention interval', async () => {
    const onScheduled = renderButton()

    await userEvent.click(await screen.findByRole('button', { name: 'Enable cleanup' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Enable automatic cleanup')).toBeInTheDocument()
    expect(within(dialog).getByRole('combobox')).toHaveTextContent('Older than 7 days')

    await userEvent.click(within(dialog).getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'Older than 1 day' }))

    await userEvent.click(within(dialog).getByRole('button', { name: 'Enable cleanup' }))

    await waitFor(() => expect(scheduleQueries).toHaveLength(1))
    expect(scheduleQueries[0]).toContain(`'delete-job-run-details'`)
    expect(scheduleQueries[0]).toContain(`'0 12 * * *'`)
    expect(scheduleQueries[0]).toContain(`interval ''1 day''`)

    await waitFor(() => expect(onScheduled).toHaveBeenCalledTimes(1))

    // The mutation invalidates the existence query, which now returns the job,
    // so the whole component (dialog included) unmounts
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Enable cleanup' })).not.toBeInTheDocument()
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('cancel closes the dialog without scheduling', async () => {
    renderButton()

    await userEvent.click(await screen.findByRole('button', { name: 'Enable cleanup' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(scheduleQueries).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Enable cleanup' })).toBeInTheDocument()
  })
})
