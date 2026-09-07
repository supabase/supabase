import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { ProjectMultiSelect } from './ProjectMultiSelect'
import type { OAuthAppsAuthorizeOrganizationProject } from '@/data/oauth-apps/oauth-apps-authorize-organization-projects-query'
import { customRender } from '@/tests/lib/custom-render'

const PROJECTS: OAuthAppsAuthorizeOrganizationProject[] = [
  { ref: 'project-1', name: 'production' },
  { ref: 'project-2', name: 'staging' },
]

const MANY_PROJECTS: OAuthAppsAuthorizeOrganizationProject[] = Array.from(
  { length: 12 },
  (_, index) => ({ ref: `project-${index + 1}`, name: `project ${index + 1}` })
)

const refsUpTo = (count: number) => MANY_PROJECTS.slice(0, count).map((project) => project.ref)

const CAP_HELPER_TEXT = 'Maximum reached. Deselect a project to choose a different one.'

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

  test('hides the counter until something is selected', () => {
    customRender(<ProjectMultiSelect projects={PROJECTS} selectedRefs={[]} onChange={vi.fn()} />)

    expect(screen.queryByText('0/10')).not.toBeInTheDocument()
  })

  test('shows the selection counter once a project is selected', () => {
    customRender(
      <ProjectMultiSelect
        projects={PROJECTS}
        selectedRefs={['project-1', 'project-2']}
        onChange={vi.fn()}
      />
    )

    expect(screen.getByText('2/10')).toBeInTheDocument()
  })

  test('at nine selected the cap is not yet reached and a tenth can be added', () => {
    const onChange = vi.fn()
    customRender(
      <ProjectMultiSelect projects={MANY_PROJECTS} selectedRefs={refsUpTo(9)} onChange={onChange} />
    )

    expect(screen.getByText('9/10')).toBeInTheDocument()
    expect(screen.queryByText(CAP_HELPER_TEXT)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('project 10'))

    expect(onChange).toHaveBeenCalledWith(refsUpTo(10))
  })

  test('at the cap it shows 10/10 and the helper text', () => {
    customRender(
      <ProjectMultiSelect projects={MANY_PROJECTS} selectedRefs={refsUpTo(10)} onChange={vi.fn()} />
    )

    expect(screen.getByText('10/10')).toBeInTheDocument()
    expect(screen.getByText(CAP_HELPER_TEXT)).toBeInTheDocument()
  })

  test('at the cap unselected options are disabled and cannot be selected', () => {
    const onChange = vi.fn()
    customRender(
      <ProjectMultiSelect
        projects={MANY_PROJECTS}
        selectedRefs={refsUpTo(10)}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByRole('combobox'))

    const unselected = screen.getByText('project 11').closest('[role="option"]')
    expect(unselected).toHaveAttribute('aria-disabled', 'true')

    fireEvent.click(screen.getByText('project 11'))
    expect(onChange).not.toHaveBeenCalled()
  })

  test('the cap never blocks deselection, which re-enables the other options', () => {
    const onChange = vi.fn()
    const { rerender } = customRender(
      <ProjectMultiSelect
        projects={MANY_PROJECTS}
        selectedRefs={refsUpTo(10)}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('project 1'))

    expect(onChange).toHaveBeenCalledWith(refsUpTo(10).slice(1))

    rerender(
      <ProjectMultiSelect projects={MANY_PROJECTS} selectedRefs={refsUpTo(9)} onChange={onChange} />
    )

    expect(screen.queryByText(CAP_HELPER_TEXT)).not.toBeInTheDocument()
    expect(screen.getByText('project 11').closest('[role="option"]')).not.toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })

  test('the required-selection error still renders at the cap boundary', () => {
    customRender(
      <ProjectMultiSelect
        projects={PROJECTS}
        selectedRefs={[]}
        onChange={vi.fn()}
        error="Must select at least one project to authorize."
      />
    )

    expect(screen.getByText('Must select at least one project to authorize.')).toBeInTheDocument()
    expect(screen.queryByText(CAP_HELPER_TEXT)).not.toBeInTheDocument()
  })
})
