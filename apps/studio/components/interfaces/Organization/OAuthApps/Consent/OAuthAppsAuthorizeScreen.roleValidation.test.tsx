import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { OAuthAppsAuthorizeScreen } from './OAuthAppsAuthorizeScreen'
import { customRender } from '@/tests/lib/custom-render'

// northwind-traders roles: northwind-storefront (administrator), northwind-cms (developer),
// fabrikam-api and fabrikam-jobs (both read_only, so both fail the write-scope check).
const READ_ONLY_PROJECTS = ['fabrikam-api', 'fabrikam-jobs']
const WRITABLE_PROJECT = 'northwind-cms'

async function selectProjects(names: string[]) {
  fireEvent.click(await screen.findByRole('combobox'))
  names.forEach((name) => fireEvent.click(screen.getByText(name)))
}

function authorize() {
  fireEvent.click(screen.getByRole('button', { name: /Authorize Vercel/ }))
}

function deselectFlagged() {
  fireEvent.click(screen.getByRole('button', { name: 'Deselect 2 projects' }))
}

async function submitTwoBlockedAndOneAllowed() {
  customRender(<OAuthAppsAuthorizeScreen mockState="role_validation" navigate={vi.fn()} />)

  await selectProjects([...READ_ONLY_PROJECTS, WRITABLE_PROJECT])
  authorize()

  return screen.findByText("Couldn't authorize 2 projects")
}

describe('OAuthAppsAuthorizeScreen post-submit role validation', () => {
  test('surfaces the failure banner naming the blocked project count', async () => {
    expect(await submitTwoBlockedAndOneAllowed()).toBeInTheDocument()
    expect(
      screen.getByText(
        'Vercel needs write access but your role is read-only on the projects highlighted. Deselect them to continue.'
      )
    ).toBeInTheDocument()
  })

  test('counts the blocked projects against the submitted selection', async () => {
    await submitTwoBlockedAndOneAllowed()

    expect(screen.getByText(/2 of 3\s+projects unavailable/)).toBeInTheDocument()
  })

  test('turns the primary action into the deselect shortcut', async () => {
    await submitTwoBlockedAndOneAllowed()

    expect(screen.getByRole('button', { name: 'Deselect 2 projects' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Authorize Vercel/ })).not.toBeInTheDocument()
  })

  test('marks the rejected projects in the dropdown', async () => {
    await submitTwoBlockedAndOneAllowed()

    const marks = screen.getAllByText('- Unavailable')
    expect(marks).toHaveLength(READ_ONLY_PROJECTS.length)
  })

  test('keeps the dropdown marks after the projects are deselected', async () => {
    await submitTwoBlockedAndOneAllowed()

    deselectFlagged()

    expect(screen.getAllByText('- Unavailable')).toHaveLength(READ_ONLY_PROJECTS.length)
  })

  test('drops the inline deselect link beneath the picker', async () => {
    await submitTwoBlockedAndOneAllowed()

    expect(screen.queryByText('Deselect projects')).not.toBeInTheDocument()
  })

  test('deselecting the blocked projects clears the whole failure treatment', async () => {
    await submitTwoBlockedAndOneAllowed()

    deselectFlagged()

    expect(screen.queryByText("Couldn't authorize 2 projects")).not.toBeInTheDocument()
    expect(screen.queryByText(/projects unavailable/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Authorize Vercel/ })).toBeInTheDocument()
  })

  test('retrying with only writable projects reaches the success screen', async () => {
    await submitTwoBlockedAndOneAllowed()

    deselectFlagged()
    authorize()

    expect(await screen.findByText('Vercel is connected')).toBeInTheDocument()
  })

  test('a selection of only writable projects never triggers validation', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="role_validation" navigate={vi.fn()} />)

    await selectProjects([WRITABLE_PROJECT])
    authorize()

    expect(await screen.findByText('Vercel is connected')).toBeInTheDocument()
  })

  test('states that predate the role check still approve read-only projects', async () => {
    customRender(<OAuthAppsAuthorizeScreen mockState="ideal" navigate={vi.fn()} />)

    await selectProjects([READ_ONLY_PROJECTS[0]])
    authorize()

    expect(await screen.findByText('Vercel is connected')).toBeInTheDocument()
  })
})
