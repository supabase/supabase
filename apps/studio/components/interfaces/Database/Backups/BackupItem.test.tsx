import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BackupItem } from './BackupItem'
import type { DatabaseBackup } from '@/data/database/backups-query'
import { customRender } from '@/tests/lib/custom-render'

const { mockUseAsyncCheckPermissions } = vi.hoisted(() => ({
  mockUseAsyncCheckPermissions: vi.fn(),
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: mockUseAsyncCheckPermissions,
}))

const backup: DatabaseBackup = {
  id: 1,
  inserted_at: '2024-01-01T00:00:00Z',
  isPhysicalBackup: false,
  project_id: 1,
  status: 'COMPLETED',
}

describe('BackupItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAsyncCheckPermissions.mockReturnValue({ can: true })
  })

  it('enables restoring for a healthy project that is not High Availability', () => {
    customRender(
      <BackupItem
        index={0}
        isHealthy={true}
        isHighAvailability={false}
        backup={backup}
        onSelectBackup={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Restore' })).toBeEnabled()
  })

  it('disables restoring with a tooltip on High Availability projects', async () => {
    customRender(
      <BackupItem
        index={0}
        isHealthy={true}
        isHighAvailability={true}
        backup={backup}
        onSelectBackup={vi.fn()}
      />
    )

    const button = screen.getByRole('button', { name: 'Restore' })
    expect(button).toBeDisabled()

    // Radix opens the tooltip on pointermove; userEvent does not synthesize
    // pointer events on disabled buttons
    fireEvent.pointerMove(button)
    expect(
      await screen.findAllByText(
        'Restoring from a backup is unavailable on High Availability projects',
        {},
        { timeout: 2000 }
      )
    ).not.toHaveLength(0)
  })
})
