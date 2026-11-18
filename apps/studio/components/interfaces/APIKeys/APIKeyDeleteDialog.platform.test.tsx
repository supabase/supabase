import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import { APIKeyDeleteDialog } from './APIKeyDeleteDialog'
import type { APIKeysData } from '@/data/api-keys/api-keys-query'
import { customRender as render } from '@/tests/lib/custom-render'
import { mockPermissionsError } from '@/tests/lib/msw-permissions'
import { NO_PERMISSIONS } from '@/tests/lib/permissions-fixtures'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return { ...actual, useIsLoggedIn: () => true, useParams: () => ({ ref: 'default' }) }
})

const apiKey = { id: 'key-1', name: 'default', type: 'secret', api_key: 'sb_secret_x' } as Extract<
  APIKeysData[number],
  { type: 'secret' }
>

function renderDialog(setKeyToDelete = vi.fn()) {
  render(
    <DropdownMenu open>
      <DropdownMenuTrigger>menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <APIKeyDeleteDialog apiKey={apiKey} setKeyToDelete={setKeyToDelete} />
      </DropdownMenuContent>
    </DropdownMenu>,
    { profileContext: createMockProfileContext() }
  )
  return setKeyToDelete
}

const item = () => screen.getByRole('menuitem', { name: /Delete API key/ })

describe('APIKeyDeleteDialog grants', () => {
  it('selects the key for deletion when granted', async () => {
    mockProjectGrantContext({ ref: 'default' })
    const setKeyToDelete = renderDialog()

    await waitFor(() => expect(item()).not.toHaveAttribute('data-disabled'))
    item().click()

    expect(setKeyToDelete).toHaveBeenCalledWith('key-1')
  })

  it('disables the item without selecting the key when denied', async () => {
    mockProjectGrantContext({ ref: 'default', permissions: NO_PERMISSIONS })
    const setKeyToDelete = renderDialog()

    // Wait for the grant to settle: the item is also disabled while loading
    await userEvent.hover(item())
    expect(
      (await screen.findAllByText('You need additional permissions to delete API keys')).length
    ).toBeGreaterThan(0)
    expect(item()).toHaveAttribute('data-disabled')
    item().click()

    expect(setKeyToDelete).not.toHaveBeenCalled()
  })

  it('disables the item when permissions fail to load', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockPermissionsError()
    const setKeyToDelete = renderDialog()

    // Wait for the grant to settle: the item is also disabled while loading
    await userEvent.hover(item())
    expect(
      (await screen.findAllByText('Failed to check permissions to delete API keys')).length
    ).toBeGreaterThan(0)
    expect(item()).toHaveAttribute('data-disabled')
    item().click()

    expect(setKeyToDelete).not.toHaveBeenCalled()
  })
})
