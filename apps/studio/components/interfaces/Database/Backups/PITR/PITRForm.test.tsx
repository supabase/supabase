import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { PITRForm } from './PITRForm'
import { customRender } from '@/tests/lib/custom-render'

mockAnimationsApi()

beforeEach(() => {
  vi.spyOn(dayjs.tz, 'guess').mockReturnValue('Europe/Madrid')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PITRForm', () => {
  test('clamps retained time to the earliest available backup on a selected boundary day', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const earliest = dayjs('2026-10-23T12:00:00Z').unix()
    customRender(
      <PITRForm
        earliestAvailableBackupUnix={earliest}
        latestAvailableBackupUnix={dayjs('2026-10-26T09:15:30Z').unix()}
        onSubmit={onSubmit}
      />
    )
    await user.click(screen.getByRole('button', { name: /October 23rd, 2026/ }))
    expect(screen.getByRole('textbox', { name: 'Hours' })).toHaveValue('14')
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ recoveryTimeTargetUnix: earliest })
    )
  })

  test('preserves entered time when changing the date across daylight saving time', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    customRender(
      <PITRForm
        earliestAvailableBackupUnix={dayjs('2026-10-23T00:00:00Z').unix()}
        latestAvailableBackupUnix={dayjs('2026-10-26T09:15:30Z').unix()}
        onSubmit={onSubmit}
      />
    )

    await user.clear(screen.getByRole('textbox', { name: 'Minutes' }))
    await user.type(screen.getByRole('textbox', { name: 'Minutes' }), '12')
    await user.tab()
    await user.click(screen.getByRole('button', { name: /October 24th, 2026/ }))

    expect(screen.getByRole('textbox', { name: 'Hours' })).toHaveValue('10')
    expect(screen.getByRole('textbox', { name: 'Minutes' })).toHaveValue('12')
    expect(screen.getByRole('textbox', { name: 'Seconds' })).toHaveValue('30')
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        recoveryTimeTargetUnix: dayjs('2026-10-24T08:12:30Z').unix(),
        recoveryTimeString: '24 Oct 2026 10:12:30',
      })
    )
  })

  test('submits the second occurrence of a repeated hour and retains it when editing seconds', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    customRender(
      <PITRForm
        earliestAvailableBackupUnix={dayjs('2026-10-24T22:30:00Z').unix()}
        latestAvailableBackupUnix={dayjs('2026-10-25T01:30:30Z').unix()}
        onSubmit={onSubmit}
      />
    )

    expect(screen.getByText('Earliest backup available for this date')).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Hours' })).toHaveValue('02')
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ recoveryTimeTargetUnix: dayjs('2026-10-25T01:30:30Z').unix() })
    )

    await user.clear(screen.getByRole('textbox', { name: 'Seconds' }))
    await user.type(screen.getByRole('textbox', { name: 'Seconds' }), '17')
    await user.tab()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({
        recoveryTimeTargetUnix: dayjs('2026-10-25T01:30:17Z').unix(),
        recoveryTimeString: '25 Oct 2026 02:30:17',
      })
    )
  })
})
