import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { useState } from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { SpecificFilterColumn } from './Users.constants'
import { UsersSearch } from './UsersSearch'
import { customRender } from '@/tests/lib/custom-render'

const { mockTrack } = vi.hoisted(() => ({
  mockTrack: vi.fn(),
}))

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => mockTrack }))

mockAnimationsApi()

const TELEMETRY_PROPS = {
  sort_column: 'created_at',
  sort_order: 'desc',
}

function UsersSearchHarness({
  initialSearch = '',
  onSelectFilterColumn = () => {},
}: {
  initialSearch?: string
  onSelectFilterColumn?: (value: SpecificFilterColumn) => void
}) {
  const [search, setSearch] = useState(initialSearch)
  return (
    <UsersSearch
      search={search}
      setSearch={setSearch}
      telemetryProps={TELEMETRY_PROPS}
      onSelectFilterColumn={onSelectFilterColumn}
    />
  )
}

describe('UsersSearch', () => {
  beforeEach(() => {
    mockTrack.mockClear()
  })

  test('exposes a search form so mobile keyboards can submit', () => {
    customRender(<UsersSearchHarness />)

    const input = screen.getByRole('searchbox', { name: 'Search by email' })
    expect(screen.getByRole('search')).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'search')
    expect(input).toHaveAttribute('enterkeyhint', 'search')
    expect(input).toHaveAttribute('aria-invalid', 'false')
    expect(screen.getByRole('button', { name: 'Search users' })).toHaveAttribute('type', 'submit')
  })

  test('applies the filter when the search form is submitted', async () => {
    const onUrlUpdate = vi.fn()
    const user = userEvent.setup()

    customRender(<UsersSearchHarness />, {
      nuqs: { hasMemory: true, onUrlUpdate },
    })

    await user.type(screen.getByRole('searchbox', { name: 'Search by email' }), 'Ada@example.com')
    fireEvent.submit(screen.getByRole('search'))

    await waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ queryString: '?keywords=ada@example.com' })
      )
    })
    expect(mockTrack).toHaveBeenCalledWith(
      'auth_users_search_submitted',
      expect.objectContaining({
        trigger: 'search_input',
        keywords: 'ada@example.com',
      })
    )
  })

  test('applies the filter from the search button', async () => {
    const onUrlUpdate = vi.fn()
    const user = userEvent.setup()

    customRender(<UsersSearchHarness />, {
      nuqs: { hasMemory: true, onUrlUpdate },
    })

    await user.type(screen.getByRole('searchbox', { name: 'Search by email' }), 'ada@example.com')
    const form = screen.getByRole('search') as HTMLFormElement
    const submit = screen.getByRole('button', { name: 'Search users' }) as HTMLButtonElement
    expect(submit.form).toBe(form)
    act(() => {
      form.requestSubmit(submit)
    })

    await waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ queryString: '?keywords=ada@example.com' })
      )
    })
  })

  test('does not apply an invalid user ID prefix', async () => {
    const onUrlUpdate = vi.fn()
    const user = userEvent.setup()

    customRender(<UsersSearchHarness />, {
      nuqs: { hasMemory: true, searchParams: { filter: 'id' }, onUrlUpdate },
    })

    await user.type(screen.getByRole('searchbox', { name: 'Search by user ID' }), 'not-a-uuid')
    expect(screen.getByRole('button', { name: 'Search users' })).toBeDisabled()
    expect(screen.getByRole('searchbox', { name: 'Search by user ID' })).toHaveAttribute(
      'aria-invalid',
      'true'
    )
    expect(screen.getByRole('status')).toHaveTextContent('User ID must be a valid UUID prefix.')
    fireEvent.submit(screen.getByRole('search'))

    expect(onUrlUpdate).not.toHaveBeenCalled()
    expect(mockTrack).not.toHaveBeenCalled()
  })
})
