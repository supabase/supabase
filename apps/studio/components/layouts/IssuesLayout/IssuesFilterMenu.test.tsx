import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LOCAL_STORAGE_KEYS } from 'common'
import { afterEach, describe, expect, it } from 'vitest'

import { IssuesFilterMenu } from './IssuesFilterMenu'
import { customRender } from '@/tests/lib/custom-render'
import { routerMock } from '@/tests/lib/route-mock'

const KEY = LOCAL_STORAGE_KEYS.ALERT_ISSUES_OUT_OF_SCOPE_VISIBLE

const openMenu = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Filters' }))
  return screen.findByRole('menuitemcheckbox', { name: 'Show out-of-scope features' })
}

afterEach(() => localStorage.removeItem(KEY))

describe('IssuesFilterMenu', () => {
  it('hides out-of-scope features by default and remembers turning them on', async () => {
    routerMock.setCurrentUrl('/projects/default')
    customRender(<IssuesFilterMenu />)

    const item = await openMenu()
    expect(item).toHaveAttribute('aria-checked', 'false')

    await userEvent.click(item)

    await waitFor(() => expect(localStorage.getItem(KEY)).toBe('true'))
    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Show out-of-scope features' })
    ).toHaveAttribute('aria-checked', 'true')
  })

  it('reads the saved setting', async () => {
    localStorage.setItem(KEY, 'true')
    routerMock.setCurrentUrl('/projects/default')
    customRender(<IssuesFilterMenu />)

    expect(await openMenu()).toHaveAttribute('aria-checked', 'true')
  })
})
