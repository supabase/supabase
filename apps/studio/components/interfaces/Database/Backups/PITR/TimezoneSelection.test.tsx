import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { describe, expect, test, vi } from 'vitest'

import { ALL_TIMEZONES } from './PITR.constants'
import { TimezoneSelection } from './TimezoneSelection'
import { customRender } from '@/tests/lib/custom-render'

mockAnimationsApi()

describe('TimezoneSelection', () => {
  test('updates Madrid offsets when the restore date crosses daylight saving time and preserves the selected timezone', async () => {
    const madridTimezone = ALL_TIMEZONES.find((timezone) => timezone.utc.includes('Europe/Madrid'))
    if (!madridTimezone) throw new Error('Madrid timezone is missing from the timezone catalog')

    const user = userEvent.setup()
    const onSelectTimezone = vi.fn()
    const winterLabel = '(UTC+01:00) Brussels, Copenhagen, Madrid, Paris'
    const summerLabel = '(UTC+02:00) Brussels, Copenhagen, Madrid, Paris'
    const { rerender } = customRender(
      <TimezoneSelection
        selectedTimezone={madridTimezone}
        date={dayjs('2026-01-15T12:00:00Z')}
        onSelectTimezone={onSelectTimezone}
      />
    )

    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveTextContent(winterLabel)
    await user.click(trigger)
    expect(await screen.findByRole('option', { name: winterLabel })).toBeVisible()

    rerender(
      <TimezoneSelection
        selectedTimezone={madridTimezone}
        date={dayjs('2026-07-15T12:00:00Z')}
        onSelectTimezone={onSelectTimezone}
      />
    )

    expect(trigger).toHaveTextContent(summerLabel)
    expect(screen.getByRole('option', { name: summerLabel })).toBeVisible()
    expect(screen.queryByRole('option', { name: winterLabel })).not.toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Search timezone...'), 'Madrid')
    const matchingTimezones = screen.getAllByRole('option')
    expect(matchingTimezones).toHaveLength(1)
    await user.click(screen.getByRole('option', { name: summerLabel }))

    expect(onSelectTimezone).toHaveBeenCalledTimes(1)
    expect(onSelectTimezone.mock.calls[0][0]).toBe(madridTimezone)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})
