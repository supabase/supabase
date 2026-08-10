import { fireEvent, screen, waitFor } from '@testing-library/react'
import { LOCAL_STORAGE_KEYS } from 'common'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest'

import { PITRForm } from './PITRForm'
import { TimezoneProvider } from '@/lib/datetime'
import { customRender } from '@/tests/lib/custom-render'

mockAnimationsApi()

// TimeInput validates with a parse format, which the shared test setup does not
// load (the app entries do)
dayjs.extend(customParseFormat)

// The bugs this covers only reproduce when the browser timezone differs from
// the selected one, so the host timezone can't be left to chance
const BROWSER_TIMEZONE = 'America/New_York'
const originalTimezone = process.env.TZ

beforeAll(() => {
  process.env.TZ = BROWSER_TIMEZONE
})

afterAll(() => {
  process.env.TZ = originalTimezone
})

afterEach(() => {
  localStorage.clear()
})

const EARLIEST_BACKUP_UNIX = dayjs.utc('2026-08-05T14:00:00Z').unix()
const LATEST_BACKUP_UNIX = dayjs.utc('2026-08-10T02:30:00Z').unix()

const renderForm = ({ withTimezoneProvider = false } = {}) => {
  const onSubmit = vi.fn()
  const form = (
    <PITRForm
      onSubmit={onSubmit}
      earliestAvailableBackupUnix={EARLIEST_BACKUP_UNIX}
      latestAvailableBackupUnix={LATEST_BACKUP_UNIX}
    />
  )
  customRender(withTimezoneProvider ? <TimezoneProvider>{form}</TimezoneProvider> : form)
  return { onSubmit }
}

const getRestorePoint = () =>
  screen.getByText('Database will be restored to:').parentElement!.querySelector('p.text-3xl')!
    .textContent

const selectTimezone = async (label: string) => {
  fireEvent.click(screen.getByRole('combobox'))
  fireEvent.click(await screen.findByRole('option', { name: label }))
}

// The calendar labels its day buttons with the full date, so the ISO day
// attribute is the stable way to pick one
const clickDay = (isoDate: string) =>
  fireEvent.click(document.querySelector(`[data-day="${isoDate}"] button`)!)

const getContinueButton = () => screen.getByRole('button', { name: 'Continue' })

const setHours = (value: string) => {
  const hours = screen.getByLabelText('Hours')
  fireEvent.change(hours, { target: { value } })
  fireEvent.blur(hours)
}

describe('PITRForm', () => {
  test('defaults to the latest backup rendered in the local timezone', () => {
    renderForm()

    // 02:30 UTC is the previous day in New York
    expect(getRestorePoint()).toBe('09 Aug 2026, 22:30:00')
  })

  test('defaults to the timezone the user picked for the dashboard', async () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.UI_TIMEZONE, JSON.stringify('Asia/Tokyo'))

    renderForm({ withTimezoneProvider: true })

    await waitFor(() => expect(getRestorePoint()).toBe('10 Aug 2026, 11:30:00'))
    expect(screen.getByRole('combobox')).toHaveTextContent('(UTC+09:00) Osaka, Sapporo, Tokyo')
  })

  test('keeps the same point in time when the timezone changes', async () => {
    renderForm()

    await selectTimezone('(UTC+00:00) Coordinated Universal Time')

    await waitFor(() => expect(getRestorePoint()).toBe('10 Aug 2026, 02:30:00'))
  })

  test('keeps the time of day when another date is picked', async () => {
    const { onSubmit } = renderForm()

    clickDay('2026-08-07')

    expect(getRestorePoint()).toBe('07 Aug 2026, 22:30:00')

    fireEvent.click(getContinueButton())
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedTimezone: BROWSER_TIMEZONE,
        recoveryTimeTargetUnix: dayjs.utc('2026-08-08T02:30:00Z').unix(),
        recoveryTimeString: '07 Aug 2026 22:30:00',
        recoveryTimeStringUtc: '08 Aug 2026 02:30:00',
      })
    )
  })

  test('blocks a time that falls outside the available range', async () => {
    renderForm()

    // The earliest backup is 10:00 in New York, so 09:00 on that day is out of range
    clickDay('2026-08-05')
    setHours('09')

    expect(
      await screen.findByText('Selected time is before the minimum time allowed')
    ).toBeInTheDocument()
    expect(getContinueButton()).toBeDisabled()
  })

  test('allows a time within the available range on the earliest date', async () => {
    renderForm()

    clickDay('2026-08-05')
    setHours('11')

    await waitFor(() => expect(getRestorePoint()).toBe('05 Aug 2026, 11:30:00'))
    expect(getContinueButton()).toBeEnabled()
  })
})
