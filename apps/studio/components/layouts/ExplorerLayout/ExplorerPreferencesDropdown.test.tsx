import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LOCAL_STORAGE_KEYS } from 'common'
import { afterEach, describe, expect, it } from 'vitest'

import { ExplorerPreferencesDropdown } from './ExplorerPreferencesDropdown'
import { customRender } from '@/tests/lib/custom-render'

afterEach(() => localStorage.clear())

describe('ExplorerPreferencesDropdown', () => {
  it('shows the Explorer startup options and saves the selected one', async () => {
    const user = userEvent.setup()
    customRender(<ExplorerPreferencesDropdown />)

    await user.click(screen.getByRole('button', { name: 'Explorer preferences' }))
    expect(screen.getByText('Open Explorer to')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('menuitemradio', { name: 'Start page' })).toHaveAttribute(
        'aria-checked',
        'true'
      )
    )

    await user.click(screen.getByRole('menuitemradio', { name: 'SQL query' }))
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.EXPLORER_PREFERENCES) ?? '{}')
      ).toMatchObject({ 'self-hosted': { home: 'query' } })
    )

    await user.click(screen.getByRole('button', { name: 'Explorer preferences' }))
    expect(screen.getByRole('menuitemradio', { name: 'SQL query' })).toHaveAttribute(
      'aria-checked',
      'true'
    )
  })
})
