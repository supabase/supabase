import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import {
  groupProjectsByOrganization,
  isValidProjectRef,
  ProjectSelector,
  type ProjectSelectorAuthState,
  type ProjectSelectorProject,
} from './index'

const organizations = [
  { slug: 'acme', name: 'Acme Inc' },
  { slug: 'globex', name: 'Globex' },
]

const projects: ProjectSelectorProject[] = [
  { ref: 'aaaaaaaaaaaaaaaaaaaa', name: 'Marketing site', organizationSlug: 'acme' },
  { ref: 'bbbbbbbbbbbbbbbbbbbb', name: 'Billing API', organizationSlug: 'acme' },
  { ref: 'cccccccccccccccccccc', name: 'Analytics', organizationSlug: 'globex' },
]

function Harness({
  authState = 'authenticated',
  isError,
  onValueChange = () => {},
}: {
  authState?: ProjectSelectorAuthState
  isError?: boolean
  onValueChange?: (value: string) => void
}) {
  const [value, setValue] = useState('')
  return (
    <ProjectSelector
      value={value}
      onValueChange={(next) => {
        setValue(next)
        onValueChange(next)
      }}
      organizations={organizations}
      projects={projects}
      authState={authState}
      isError={isError}
      signInUrl="/sign-in"
    />
  )
}

describe('isValidProjectRef', () => {
  it('accepts 20 lowercase letters only', () => {
    expect(isValidProjectRef('abcdefghijklmnopqrst')).toBe(true)
    expect(isValidProjectRef('abc')).toBe(false)
    expect(isValidProjectRef('ABCDEFGHIJKLMNOPQRST')).toBe(false)
    expect(isValidProjectRef('abcdefghijklmnopqrs1')).toBe(false)
  })
})

describe('groupProjectsByOrganization', () => {
  it('groups projects in organization order and drops empty organizations', () => {
    const groups = groupProjectsByOrganization(
      [...organizations, { slug: 'empty', name: 'Empty' }],
      projects
    )
    expect(groups.map((g) => g.organization.slug)).toEqual(['acme', 'globex'])
    expect(groups[0].projects).toHaveLength(2)
  })

  it('keeps projects whose organization is unknown', () => {
    const groups = groupProjectsByOrganization([], projects.slice(2))
    expect(groups).toEqual([
      { organization: { slug: 'globex', name: 'globex' }, projects: [projects[2]] },
    ])
  })
})

describe('ProjectSelector', () => {
  it('lists projects grouped by organization and returns the project ref', async () => {
    const onValueChange = vi.fn()
    render(<Harness onValueChange={onValueChange} />)

    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getByText('Acme Inc')).toBeInTheDocument()
    expect(screen.getByText('Globex')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Billing API'))
    expect(onValueChange).toHaveBeenCalledWith('bbbbbbbbbbbbbbbbbbbb')
    expect(screen.getByRole('combobox')).toHaveTextContent('Billing API')
  })

  it('filters by organization name', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.type(screen.getByPlaceholderText(/search projects/i), 'globex')

    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.queryByText('Billing API')).not.toBeInTheDocument()
  })

  it('filters by project ref', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.type(screen.getByPlaceholderText(/search projects/i), 'aaaaaaaa')

    expect(screen.getByText('Marketing site')).toBeInTheDocument()
    expect(screen.queryByText('Analytics')).not.toBeInTheDocument()
  })

  it('offers a valid project ref typed in the search that is not in the list', async () => {
    const onValueChange = vi.fn()
    render(<Harness onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.type(screen.getByPlaceholderText(/search projects/i), 'zzzzzzzzzzzzzzzzzzzz')

    await userEvent.click(screen.getByText('Use project ref'))
    expect(onValueChange).toHaveBeenCalledWith('zzzzzzzzzzzzzzzzzzzz')
  })

  it('falls back to a project ref input when signed out', () => {
    const onValueChange = vi.fn()
    render(<Harness authState="unauthenticated" onValueChange={onValueChange} />)

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in')

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: ' abcdefghijklmnopqrst ' } })
    expect(onValueChange).toHaveBeenCalledWith('abcdefghijklmnopqrst')
    expect(input).toHaveAccessibleDescription(/enter a project ref/i)
  })

  it('falls back to a project ref input when projects fail to load', () => {
    render(<Harness isError />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByText(/couldn't load your projects/i)).toBeInTheDocument()
  })

  it('disables the trigger while the session is loading', () => {
    render(<Harness authState="loading" />)
    expect(screen.getByRole('combobox')).toBeDisabled()
    expect(screen.getByRole('combobox')).toHaveTextContent('Loading projects...')
  })
})
