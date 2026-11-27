import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { LOCAL_STORAGE_KEYS } from 'common'
import { HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { POLL_INTERVAL_MS, RestoringState } from './RestoringState'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ProjectDetailResponse = components['schemas']['ProjectDetailResponse_Output']
type ProjectStatus = ProjectDetailResponse['status']
type DownloadableBackupsResponse = components['schemas']['DownloadableBackupsResponse_Output']

const PROJECT_REF = 'default'

const createProject = (status: ProjectStatus): ProjectDetailResponse => ({
  cloud_provider: 'AWS',
  connectionString: `postgresql://postgres:password@db.${PROJECT_REF}.supabase.co:5432/postgres`,
  db_host: `db.${PROJECT_REF}.supabase.co`,
  high_availability: false,
  id: 1,
  infra_compute_size: 'micro',
  inserted_at: '2026-01-01T00:00:00.000Z',
  integration_source: null,
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  name: 'Production',
  organization_id: 1,
  ref: PROJECT_REF,
  region: 'us-east-1',
  restUrl: `https://${PROJECT_REF}.supabase.co`,
  status,
  subscription_id: 'subscription-1',
  updated_at: '2026-01-01T00:00:00.000Z',
})

const createStatusSequence = <T,>(statuses: [T, ...T[]]) => {
  const queue = [...statuses]
  return () => (queue.length > 1 ? queue.shift()! : queue[0])
}

const mockProjectDetail = (statuses: [ProjectStatus, ...ProjectStatus[]]) => {
  const nextStatus = createStatusSequence(statuses)
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () => HttpResponse.json<ProjectDetailResponse>(createProject(nextStatus())),
  })
}

const mockProjectStatus = (statuses: [ProjectStatus, ...ProjectStatus[]]) => {
  const nextStatus = createStatusSequence(statuses)
  const requests = { count: 0 }
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/status',
    response: () => {
      requests.count += 1
      return HttpResponse.json({ status: nextStatus() })
    },
  })
  return requests
}

// Advances past one status poll so the next queued status is fetched
const advancePoll = () => act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS))

const mockDownloadableBackups = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/database/:ref/backups/downloadable-backups',
    response: () =>
      HttpResponse.json<DownloadableBackupsResponse>({
        backups: [
          {
            id: 1,
            inserted_at: '2026-01-01T00:00:00.000Z',
            isPhysicalBackup: false,
            project_id: 1,
            status: 'COMPLETED',
          },
        ],
        status: 'ok',
      }),
  })
}

describe('RestoringState', () => {
  beforeEach(() => {
    // Status polling runs on a 4s interval; fake timers avoid waiting on it in real time
    vi.useFakeTimers({ shouldAdvanceTime: true })
    window.localStorage.clear()
    mockDownloadableBackups()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('shows restoration in progress while the backend reports RESTORING', async () => {
    mockProjectDetail(['RESTORING'])
    const statusRequests = mockProjectStatus(['RESTORING'])

    customRender(<RestoringState />)

    expect(await screen.findByText('Restoration in progress')).toBeInTheDocument()
    // A second poll only fires after the first response has been rendered
    await advancePoll()
    await waitFor(() => expect(statusRequests.count).toBe(2))
    expect(screen.queryByText('Restoration complete!')).not.toBeInTheDocument()
  })

  test('ignores an early stale healthy reading and only completes once the restore actually finishes', async () => {
    mockProjectDetail(['RESTORING'])
    const statusRequests = mockProjectStatus(['ACTIVE_HEALTHY', 'RESTORING', 'ACTIVE_HEALTHY'])

    customRender(<RestoringState />)

    expect(await screen.findByText('Restoration in progress')).toBeInTheDocument()
    // A second poll only fires after the stale healthy response has been rendered
    await advancePoll()
    await waitFor(() => expect(statusRequests.count).toBe(2))
    expect(screen.queryByText('Restoration complete!')).not.toBeInTheDocument()

    await advancePoll()
    expect(await screen.findByText('Restoration complete!')).toBeInTheDocument()
  })

  test('clears the persisted restore start time when the restore fails', async () => {
    const storageKey = LOCAL_STORAGE_KEYS.PROJECT_RESTORING_STARTED_AT(PROJECT_REF)
    window.localStorage.setItem(storageKey, String(Date.now()))
    mockProjectDetail(['RESTORING'])
    mockProjectStatus(['RESTORE_FAILED'])

    customRender(<RestoringState />)

    await waitFor(() => {
      expect(window.localStorage.getItem(storageKey)).toBeNull()
    })
  })

  test('completes after restoring and does not leave Return to project stuck loading when the details still report restoring', async () => {
    mockProjectDetail(['RESTORING'])
    mockProjectStatus(['RESTORING', 'ACTIVE_HEALTHY'])

    customRender(<RestoringState />)

    expect(await screen.findByText('Restoration in progress')).toBeInTheDocument()
    await advancePoll()
    expect(await screen.findByText('Restoration complete!')).toBeInTheDocument()

    const returnToProject = screen.getByRole('button', { name: 'Return to project' })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.click(returnToProject)

    await waitFor(() => {
      expect(returnToProject).not.toBeDisabled()
    })
  })
})
