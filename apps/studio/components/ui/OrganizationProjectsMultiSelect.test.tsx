import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { mockIntersectionObserver } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { useState } from 'react'
import { describe, expect, test, vi } from 'vitest'

import {
  OrganizationProjectsMultiSelect,
  SelectedProject,
} from '@/components/ui/OrganizationProjectsMultiSelect'
import type { OrgProject } from '@/data/projects/org-projects-infinite-query'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'

type OrganizationResponse = components['schemas']['OrganizationResponse_Output']
type OrganizationProjectsResponse = components['schemas']['OrganizationProjectsResponse_Output']

// The infinite-scroll sentinel uses IntersectionObserver, which jsdom lacks
mockIntersectionObserver()

const ORG_SLUG = 'test-org'

vi.mock('common', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('common')
  return { ...actual, useParams: () => ({ slug: ORG_SLUG }), useIsLoggedIn: () => true }
})

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, IS_PLATFORM: true }
})

const makeProject = (ref: string, name: string): OrgProject => ({
  cloud_provider: 'AWS',
  databases: [],
  inserted_at: '2026-01-01T00:00:00.000Z',
  integration_source: null,
  is_branch: false,
  ref,
  name,
  region: 'us-east-1',
  status: 'ACTIVE_HEALTHY',
})

function setupProjectsMock(projects: OrgProject[]) {
  const requestedSearches: string[] = []

  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/projects',
    response: ({ request }) => {
      const url = new URL(request.url)
      const limit = Number(url.searchParams.get('limit') ?? projects.length)
      const offset = Number(url.searchParams.get('offset') ?? 0)
      const search = url.searchParams.get('search') ?? ''
      requestedSearches.push(search)

      const filtered = search
        ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
        : projects
      const paginated = filtered.slice(offset, offset + limit)

      return HttpResponse.json<OrganizationProjectsResponse>({
        projects: paginated,
        pagination: { count: filtered.length, limit, offset },
      })
    },
  })

  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: () =>
      HttpResponse.json<OrganizationResponse[]>([
        createMockOrganizationResponse({ id: 1, slug: ORG_SLUG, name: 'Test Org' }),
      ]),
  })

  return { requestedSearches }
}

function Harness({
  initialSelectedRefs = [],
  knownProjects,
  disabledRefs,
  onChange,
}: {
  initialSelectedRefs?: string[]
  knownProjects?: SelectedProject[]
  disabledRefs?: string[]
  onChange?: (refs: string[], selected: SelectedProject[]) => void
}) {
  const [selectedRefs, setSelectedRefs] = useState<string[]>(initialSelectedRefs)
  return (
    <OrganizationProjectsMultiSelect
      selectedRefs={selectedRefs}
      onChange={(refs, selected) => {
        setSelectedRefs(refs)
        onChange?.(refs, selected)
      }}
      knownProjects={knownProjects}
      disabledRefs={disabledRefs}
    />
  )
}

function renderHarness(props: Parameters<typeof Harness>[0] = {}) {
  return customRender(<Harness {...props} />, { profileContext: createMockProfileContext() })
}

async function openDropdown() {
  const trigger = screen.getByRole('combobox')
  await userEvent.click(trigger)
  return trigger
}

describe('OrganizationProjectsMultiSelect', () => {
  test('lists every project as an unchecked option when nothing is selected', async () => {
    setupProjectsMock([makeProject('ref-1', 'Alpha'), makeProject('ref-2', 'Beta')])
    renderHarness()

    await openDropdown()

    const alpha = await screen.findByRole('option', { name: /Alpha/ })
    const beta = screen.getByRole('option', { name: /Beta/ })
    expect(within(alpha).getByRole('checkbox')).not.toBeChecked()
    expect(within(beta).getByRole('checkbox')).not.toBeChecked()
  })

  test('selecting a project checks it and reports the new selection', async () => {
    setupProjectsMock([makeProject('ref-1', 'Alpha'), makeProject('ref-2', 'Beta')])
    const onChange = vi.fn()
    renderHarness({ onChange })

    await openDropdown()
    await userEvent.click(await screen.findByRole('option', { name: /Alpha/ }))

    expect(onChange).toHaveBeenCalledWith(['ref-1'], [{ ref: 'ref-1', name: 'Alpha' }])
    await waitFor(() => {
      expect(
        within(screen.getByRole('option', { name: /Alpha/ })).getByRole('checkbox')
      ).toBeChecked()
    })
  })

  test('clicking a selected project again deselects it', async () => {
    setupProjectsMock([makeProject('ref-1', 'Alpha'), makeProject('ref-2', 'Beta')])
    const onChange = vi.fn()
    renderHarness({ initialSelectedRefs: ['ref-1'], onChange })

    await openDropdown()
    await userEvent.click(await screen.findByRole('option', { name: /Alpha/ }))

    expect(onChange).toHaveBeenCalledWith([], [])
  })

  test('removing a badge from the trigger deselects that project', async () => {
    setupProjectsMock([makeProject('ref-1', 'Alpha'), makeProject('ref-2', 'Beta')])
    const onChange = vi.fn()
    renderHarness({
      initialSelectedRefs: ['ref-1', 'ref-2'],
      knownProjects: [
        { ref: 'ref-1', name: 'Alpha' },
        { ref: 'ref-2', name: 'Beta' },
      ],
      onChange,
    })

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()

    // Badges render in selectedRefs order (Alpha, then Beta); each has a delete icon
    // with no accessible role, so index into them in that order.
    const [removeAlphaBadge] = document.querySelectorAll<HTMLElement>('.cursor-pointer')
    await userEvent.click(removeAlphaBadge)

    expect(onChange).toHaveBeenCalledWith(['ref-2'], [{ ref: 'ref-2', name: 'Beta' }])
  })

  test('shows a known project name on the trigger before the list has loaded', () => {
    setupProjectsMock([makeProject('ref-1', 'Alpha')])
    renderHarness({
      initialSelectedRefs: ['ref-1'],
      knownProjects: [{ ref: 'ref-1', name: 'Alpha' }],
    })

    expect(screen.getByText('Alpha')).toBeInTheDocument()
  })

  test('typing searches the project list', async () => {
    const { requestedSearches } = setupProjectsMock([
      makeProject('ref-1', 'Alpha'),
      makeProject('ref-2', 'Beta'),
    ])
    renderHarness()

    await openDropdown()
    await screen.findByRole('option', { name: /Alpha/ })

    await userEvent.type(screen.getByPlaceholderText('Search project...'), 'Bet')

    await waitFor(
      () => {
        expect(requestedSearches).toContain('Bet')
      },
      { timeout: 2000 }
    )
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: /Alpha/ })).not.toBeInTheDocument()
      expect(screen.getByRole('option', { name: /Beta/ })).toBeInTheDocument()
    })
  })

  test('a disabled (permission-locked) project cannot be deselected', async () => {
    setupProjectsMock([makeProject('ref-1', 'Alpha'), makeProject('ref-2', 'Beta')])
    const onChange = vi.fn()
    renderHarness({
      initialSelectedRefs: ['ref-1'],
      knownProjects: [{ ref: 'ref-1', name: 'Alpha' }],
      disabledRefs: ['ref-1'],
      onChange,
    })

    await openDropdown()
    const option = await screen.findByRole('option', { name: /Alpha/ })
    expect(within(option).getByRole('checkbox')).toBeChecked()
    expect(within(option).getByRole('checkbox')).toBeDisabled()

    await userEvent.click(option)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('renders a large project list without selecting everything eagerly', async () => {
    const manyProjects = Array.from({ length: 120 }, (_, i) =>
      makeProject(`ref-${i}`, `Project ${String(i).padStart(3, '0')}`)
    )
    setupProjectsMock(manyProjects)
    renderHarness()

    await openDropdown()

    await screen.findByRole('option', { name: /Project 000/ })
    expect(screen.getAllByRole('option')).toHaveLength(96)
    expect(screen.queryByRole('option', { name: /Project 119/ })).not.toBeInTheDocument()
  })
})
