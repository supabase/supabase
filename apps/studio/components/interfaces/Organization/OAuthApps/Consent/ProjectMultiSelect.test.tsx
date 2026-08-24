import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { ProjectMultiSelect } from './ProjectMultiSelect'
import type { OAuthAppsAuthorizeOrganizationProject } from '@/data/oauth-apps/oauth-apps-authorize-organization-projects-query'
import { customRender } from '@/tests/lib/custom-render'

const PROJECTS: OAuthAppsAuthorizeOrganizationProject[] = [
  { ref: 'project-1', name: 'production' },
  { ref: 'project-2', name: 'staging' },
]

describe('ProjectMultiSelect', () => {
  test('shows a placeholder when nothing is selected', () => {
    customRender(<ProjectMultiSelect projects={PROJECTS} selectedRefs={[]} onChange={vi.fn()} />)

    expect(screen.getByRole('combobox')).toHaveTextContent('Select projects...')
  })

  test('renders the selection count in the trigger', () => {
    customRender(
      <ProjectMultiSelect
        projects={PROJECTS}
        selectedRefs={['project-1', 'project-2']}
        onChange={vi.fn()}
      />
    )

    expect(screen.getByRole('combobox')).toHaveTextContent('2 projects')
  })

  test('fires onChange with the toggled id added', () => {
    const onChange = vi.fn()
    customRender(<ProjectMultiSelect projects={PROJECTS} selectedRefs={[]} onChange={onChange} />)

    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('production'))

    expect(onChange).toHaveBeenCalledWith(['project-1'])
  })

  test('fires onChange with the toggled id removed', () => {
    const onChange = vi.fn()
    customRender(
      <ProjectMultiSelect projects={PROJECTS} selectedRefs={['project-1']} onChange={onChange} />
    )

    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('production'))

    expect(onChange).toHaveBeenCalledWith([])
  })

  test('does not render an error message by default', () => {
    customRender(<ProjectMultiSelect projects={PROJECTS} selectedRefs={[]} onChange={vi.fn()} />)

    expect(
      screen.queryByText('Must select at least one project to authorize.')
    ).not.toBeInTheDocument()
  })

  test('renders the error message when the error prop is set', () => {
    customRender(
      <ProjectMultiSelect
        projects={PROJECTS}
        selectedRefs={[]}
        onChange={vi.fn()}
        error="Must select at least one project to authorize."
      />
    )

    expect(screen.getByText('Must select at least one project to authorize.')).toBeInTheDocument()
  })

  test('search filters the visible project rows', () => {
    customRender(<ProjectMultiSelect projects={PROJECTS} selectedRefs={[]} onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('combobox'))
    expect(screen.getByText('production')).toBeInTheDocument()
    expect(screen.getByText('staging')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Search projects'), {
      target: { value: 'prod' },
    })

    expect(screen.getByText('production')).toBeInTheDocument()
    expect(screen.queryByText('staging')).not.toBeInTheDocument()
  })

  test('has no select-all control', () => {
    customRender(<ProjectMultiSelect projects={PROJECTS} selectedRefs={[]} onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('combobox'))

    expect(screen.queryByText(/select all/i)).not.toBeInTheDocument()
  })
})
