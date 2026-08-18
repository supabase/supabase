import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { LOCAL_STORAGE_KEYS } from 'common'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test } from 'vitest'

import { POLL_INTERVAL_MS, RestoringState } from './RestoringState'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ProjectDetailResponse = components['schemas']['ProjectDetailResponse']
type ProjectStatus = ProjectDetailResponse['status']
type DownloadableBackupsResponse = components['schemas']['DownloadableBackupsResponse']

const PROJECT_REF = 'default'

const SETTLE_MS = 2000

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
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/status',
    response: () => HttpResponse.json({ status: nextStatus() }),
  })
}

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
    window.localStorage.clear()
    mockDownloadableBackups()
  })

  test('shows restoration in progress while the backend reports RESTORING', async () => {
    mockProjectDetail(['RESTORING'])
    mockProjectStatus(['RESTORING'])

    customRender(<RestoringState />)

    expect(await screen.findByText('Restoration in progress')).toBeInTheDocument()
    expect(screen.queryByText('Restoration complete!')).not.toBeInTheDocument()
  })

  test('shows restoration complete once the project goes healthy after restoring', async () => {
    mockProjectDetail(['RESTORING'])
    mockProjectStatus(['RESTORING', 'ACTIVE_HEALTHY'])

    customRender(<RestoringState />)

    expect(await screen.findByText('Restoration in progress')).toBeInTheDocument()
    expect(
      await screen.findByText('Restoration complete!', {}, { timeout: POLL_INTERVAL_MS + 2000 })
    ).toBeInTheDocument()
  })

  test('does not claim completion when the first status poll still reports the pre-restore healthy state', async () => {
    mockProjectDetail(['RESTORING'])
    mockProjectStatus(['ACTIVE_HEALTHY', 'RESTORING'])

    customRender(<RestoringState />)

    await expect(
      screen.findByText('Restoration complete!', {}, { timeout: SETTLE_MS })
    ).rejects.toThrow()
    expect(screen.getByText('Restoration in progress')).toBeInTheDocument()
  })

  test(
    'still reaches completion after an early healthy reading, once the restore actually finishes',
    async () => {
      mockProjectDetail(['RESTORING'])
      mockProjectStatus(['ACTIVE_HEALTHY', 'RESTORING', 'ACTIVE_HEALTHY'])

      customRender(<RestoringState />)

      expect(await screen.findByText('Restoration in progress')).toBeInTheDocument()
      expect(
        await screen.findByText(
          'Restoration complete!',
          {},
          { timeout: POLL_INTERVAL_MS * 3 + SETTLE_MS }
        )
      ).toBeInTheDocument()
    },
    POLL_INTERVAL_MS * 3 + SETTLE_MS * 2
  )

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

  test(
    'does not leave Return to project stuck loading when the details still report restoring',
    async () => {
      mockProjectDetail(['RESTORING'])
      mockProjectStatus(['RESTORING', 'ACTIVE_HEALTHY'])

      customRender(<RestoringState />)

      const returnToProject = await screen.findByRole(
        'button',
        { name: 'Return to project' },
        { timeout: POLL_INTERVAL_MS + SETTLE_MS }
      )
      await userEvent.click(returnToProject)

      await waitFor(() => {
        expect(returnToProject).not.toBeDisabled()
      })
    },
    POLL_INTERVAL_MS + SETTLE_MS * 2
  )
})
