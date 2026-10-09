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

beforeAll(() => {
  vi.stubEnv('TZ', BROWSER_TIMEZONE)
})

afterAll(() => {
  vi.unstubAllEnvs()
})

afterEach(() => {
  localStorage.clear()
})

const EARLIEST_BACKUP_UNIX = dayjs.utc('2026-08-05T14:00:00Z').unix()
const LATEST_BACKUP_UNIX = dayjs.utc('2026-08-10T02:30:00Z').unix()

type RenderFormOptions = {
  withTimezoneProvider?: boolean
  earliestAvailableBackupUnix?: number
  latestAvailableBackupUnix?: number
  initialTimezone?: string
}

const renderForm = ({
  withTimezoneProvider = false,
  earliestAvailableBackupUnix = EARLIEST_BACKUP_UNIX,
  latestAvailableBackupUnix = LATEST_BACKUP_UNIX,
  initialTimezone,
}: RenderFormOptions = {}) => {
  const onSubmit = vi.fn()
  const form = (
    <PITRForm
      onSubmit={onSubmit}
      earliestAvailableBackupUnix={earliestAvailableBackupUnix}
      latestAvailableBackupUnix={latestAvailableBackupUnix}
      initialTimezone={initialTimezone}
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

const setMinutes = (value: string) => {
  const minutes = screen.getByLabelText('Minutes')
  fireEvent.change(minutes, { target: { value } })
  fireEvent.blur(minutes)
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

  test('uses the initial timezone and its offset at the selected recovery point', () => {
    renderForm({
      earliestAvailableBackupUnix: dayjs.utc('2026-01-10T18:30:00Z').unix(),
      latestAvailableBackupUnix: dayjs.utc('2026-01-15T18:30:00Z').unix(),
      initialTimezone: 'America/New_York',
    })

    expect(getRestorePoint()).toBe('15 Jan 2026, 13:30:00')
    expect(screen.getByRole('combobox')).toHaveTextContent('(UTC-05:00) Eastern Time (US & Canada)')
  })

  test('keeps the same point in time when the timezone changes', async () => {
    renderForm()

    await selectTimezone('(UTC+00:00) Coordinated Universal Time')

    await waitFor(() => expect(getRestorePoint()).toBe('10 Aug 2026, 02:30:00'))
  })

  test('shows the available month when the timezone moves the range across a month boundary', async () => {
    renderForm({
      earliestAvailableBackupUnix: dayjs.utc('2026-08-01T01:00:00Z').unix(),
      latestAvailableBackupUnix: dayjs.utc('2026-08-01T02:30:00Z').unix(),
    })

    expect(screen.getByText('July 2026')).toBeInTheDocument()

    await selectTimezone('(UTC+00:00) Coordinated Universal Time')

    await waitFor(() => expect(screen.getByText('August 2026')).toBeInTheDocument())
  })

  test('keeps the selected month visible when the timezone changes', async () => {
    renderForm({
      earliestAvailableBackupUnix: dayjs.utc('2026-07-01T14:00:00Z').unix(),
    })

    fireEvent.click(screen.getByRole('button', { name: /previous month/i }))
    clickDay('2026-07-15')

    await selectTimezone('(UTC+00:00) Coordinated Universal Time')

    await waitFor(() => expect(screen.getByText('July 2026')).toBeInTheDocument())
  })

  test('submits the correct instant when editing time across a daylight-saving transition', async () => {
    const { onSubmit } = renderForm({
      earliestAvailableBackupUnix: dayjs.utc('2026-11-01T04:00:00Z').unix(),
      latestAvailableBackupUnix: dayjs.utc('2026-11-01T07:30:00Z').unix(),
    })

    setHours('00')
    fireEvent.click(getContinueButton())

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        recoveryTimeTargetUnix: dayjs.utc('2026-11-01T04:30:00Z').unix(),
        recoveryTimeString: '01 Nov 2026 00:30:00',
        recoveryTimeStringUtc: '01 Nov 2026 04:30:00',
      })
    )
  })

  test('allows the second occurrence of a fall-back time within the available range', async () => {
    const { onSubmit } = renderForm({
      earliestAvailableBackupUnix: dayjs.utc('2026-11-01T06:00:00Z').unix(),
      latestAvailableBackupUnix: dayjs.utc('2026-11-01T07:00:00Z').unix(),
      initialTimezone: 'America/New_York',
    })

    setHours('01')
    await waitFor(() => expect(getRestorePoint()).toBe('01 Nov 2026, 01:00:00'))
    setMinutes('30')

    await waitFor(() => expect(getRestorePoint()).toBe('01 Nov 2026, 01:30:00'))
    expect(getContinueButton()).toBeEnabled()

    fireEvent.click(getContinueButton())
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        recoveryTimeTargetUnix: dayjs.utc('2026-11-01T06:30:00Z').unix(),
      })
    )
  })

  test('shows both daily range hints across a fall-back offset change', () => {
    renderForm({
      earliestAvailableBackupUnix: dayjs.utc('2026-11-01T04:30:00Z').unix(),
      latestAvailableBackupUnix: dayjs.utc('2026-11-01T06:30:00Z').unix(),
      initialTimezone: 'America/New_York',
    })

    expect(
      screen.getByText('Earliest backup available for this date').parentElement
    ).toHaveTextContent('Earliest backup available for this date: 00:30:00')
    expect(
      screen.getByText('Latest backup available for this date').parentElement
    ).toHaveTextContent('Latest backup available for this date: 01:30:00')
  })

  test('blocks the first occurrence of a fall-back time before the available range', async () => {
    const { onSubmit } = renderForm({
      earliestAvailableBackupUnix: dayjs.utc('2026-11-01T06:00:00Z').unix(),
      latestAvailableBackupUnix: dayjs.utc('2026-11-01T07:00:00Z').unix(),
      initialTimezone: 'America/New_York',
    })

    setHours('00')
    await waitFor(() => expect(getRestorePoint()).toBe('01 Nov 2026, 00:00:00'))
    setMinutes('30')
    await waitFor(() => expect(getRestorePoint()).toBe('01 Nov 2026, 00:30:00'))
    setHours('01')

    expect(
      await screen.findByText('Selected time is before the minimum time allowed')
    ).toBeInTheDocument()
    expect(getRestorePoint()).toBe('01 Nov 2026, 01:30:00')
    expect(getContinueButton()).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(getContinueButton())
    expect(onSubmit).not.toHaveBeenCalled()
  })

  test('blocks an invalid numeric time and resets it when the selected instant changes', async () => {
    const { onSubmit } = renderForm()

    setHours('99')

    expect(await screen.findByText('Please enter a valid time')).toBeInTheDocument()
    expect(getContinueButton()).toBeDisabled()
    fireEvent.click(getContinueButton())
    expect(onSubmit).not.toHaveBeenCalled()
    expect(getRestorePoint()).toBe('09 Aug 2026, 22:30:00')

    clickDay('2026-08-08')

    await waitFor(() =>
      expect(screen.queryByText('Please enter a valid time')).not.toBeInTheDocument()
    )
    expect(screen.getByLabelText('Hours')).toHaveValue('22')
    expect(getContinueButton()).toBeEnabled()
  })

  test('resets an invalid time when switching between timezones with the same offset', async () => {
    renderForm({ initialTimezone: 'Etc/GMT' })

    setHours('99')
    expect(await screen.findByText('Please enter a valid time')).toBeInTheDocument()

    await selectTimezone('(UTC+00:00) Monrovia, Reykjavik')

    await waitFor(() =>
      expect(screen.queryByText('Please enter a valid time')).not.toBeInTheDocument()
    )
    expect(screen.getByLabelText('Hours')).toHaveValue('02')
    expect(getRestorePoint()).toBe('10 Aug 2026, 02:30:00')
    expect(getContinueButton()).toBeEnabled()
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
    const { onSubmit } = renderForm()

    // The earliest backup is 10:00 in New York, so 09:00 on that day is out of range
    clickDay('2026-08-05')
    setHours('09')

    expect(
      await screen.findByText('Selected time is before the minimum time allowed')
    ).toBeInTheDocument()
    expect(getContinueButton()).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(getContinueButton())
    expect(onSubmit).not.toHaveBeenCalled()
  })

  test('allows a time within the available range on the earliest date', async () => {
    renderForm()

    clickDay('2026-08-05')
    setHours('11')

    await waitFor(() => expect(getRestorePoint()).toBe('05 Aug 2026, 11:30:00'))
    expect(getContinueButton()).toBeEnabled()
  })
})
