import { fireEvent, screen, within } from '@testing-library/react'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'

import { PITRSelection } from './PITRSelection'
import type { components } from '@/data/api'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true, isLoading: false, isSuccess: true }),
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useIsOrioleDbInAws: () => false,
}))

mockAnimationsApi()
dayjs.extend(customParseFormat)

type BackupsResponse = components['schemas']['BackupsResponse']
type DatabaseResponse = components['schemas']['DatabaseDetailResponse_Output']

beforeAll(() => {
  vi.stubEnv('TZ', 'UTC')
})

afterAll(() => {
  vi.unstubAllEnvs()
})

describe('PITRSelection', () => {
  test('keeps the status timezone through configuration and confirmation', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/database/:ref/backups',
      response: () =>
        HttpResponse.json<BackupsResponse>({
          backups: [],
          physicalBackupData: {
            earliestPhysicalBackupDateUnix: dayjs.utc('2026-01-10T18:30:00Z').unix(),
            latestPhysicalBackupDateUnix: dayjs.utc('2026-01-15T18:30:00Z').unix(),
          },
          pitr_enabled: true,
          region: 'us-east-1',
          walg_enabled: true,
        }),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/databases',
      response: () => HttpResponse.json<DatabaseResponse[]>([]),
    })

    customRender(<PITRSelection />)

    fireEvent.click(await screen.findByRole('combobox'))
    fireEvent.click(
      await screen.findByRole('option', {
        name: '(UTC-05:00) Eastern Time (US & Canada)',
      })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Start a restore' }))

    expect(await screen.findByText('15 Jan 2026, 13:30:00')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    const confirmation = await screen.findByRole('alertdialog')
    expect(
      within(confirmation).getByText('(UTC-05:00) Eastern Time (US & Canada)')
    ).toBeInTheDocument()
    expect(within(confirmation).getByText('15 Jan 2026 13:30:00')).toBeInTheDocument()
  })
})
