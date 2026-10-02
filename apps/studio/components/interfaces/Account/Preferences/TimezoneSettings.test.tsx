import { fireEvent, screen, waitFor } from '@testing-library/react'
import { LOCAL_STORAGE_KEYS } from 'common'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TimezoneSettings } from './TimezoneSettings'
import { formatTimezoneLabel } from '@/lib/constants/timezones'
import { TimezoneProvider } from '@/lib/datetime'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))

mockAnimationsApi()

afterEach(() => {
  localStorage.clear()
})

describe('TimezoneSettings', () => {
  it('preserves a stored timezone alias after local storage hydration', async () => {
    const storedTimezone = 'America/Vancouver'
    const label = formatTimezoneLabel(storedTimezone)
    const aliasLabel = `${label} (${storedTimezone})`
    localStorage.setItem(LOCAL_STORAGE_KEYS.UI_TIMEZONE, JSON.stringify(storedTimezone))

    customRender(
      <TimezoneProvider>
        <TimezoneSettings />
      </TimezoneProvider>
    )

    const trigger = screen.getByRole('combobox')
    await waitFor(() => expect(trigger).toHaveTextContent(label))

    fireEvent.click(trigger)
    fireEvent.click(await screen.findByRole('option', { name: aliasLabel }))

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.UI_TIMEZONE) ?? 'null')).toBe(
        storedTimezone
      )
    })
  })
})
