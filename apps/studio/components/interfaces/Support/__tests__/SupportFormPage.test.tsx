import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
// End of third-party imports

import { createMockOrganization, createMockProject } from 'tests/helpers'
import { createMockProfileContext } from 'tests/lib/profile-helpers'
import { customRender } from 'tests/lib/custom-render'
import { addAPIMock } from 'tests/lib/msw'
import { SupportFormPage } from '../SupportFormPage'
import { HttpResponse, http } from 'msw'
import { mswServer } from 'tests/lib/msw'

const mockOrganizations = [
  createMockOrganization({
    id: 1,
    slug: 'org-1',
    name: 'Organization 1',
    plan: { id: 'free', name: 'Free' },
  }),
  createMockOrganization({
    id: 2,
    slug: 'org-2',
    name: 'Organization 2',
    plan: { id: 'pro', name: 'Pro' },
  }),
]

const mockProjects = [
  {
    ...createMockProject({
      id: 1,
      ref: 'project-1',
      name: 'Project 1',
      organization_id: 1,
    }),
    organization_slug: 'org-1',
    preview_branch_refs: [],
  },
  {
    ...createMockProject({
      id: 2,
      ref: 'project-2',
      name: 'Project 2',
      organization_id: 2,
    }),
    organization_slug: 'org-2',
    preview_branch_refs: [],
  },
  {
    ...createMockProject({
      id: 3,
      ref: 'project-3',
      name: 'Project 3',
      organization_id: 1,
    }),
    organization_slug: 'org-1',
    preview_branch_refs: [],
  },
]

const renderSupportFormPage = (options?: Parameters<typeof customRender>[1]) =>
  customRender(<SupportFormPage />, {
    profileContext: createMockProfileContext(),
    ...options,
  })

vi.mock('react-inlinesvg', () => ({
  __esModule: true,
  default: () => null,
}))

vi.mock(import('common'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useParams: vi.fn().mockReturnValue({ ref: 'default' }),
    useIsLoggedIn: vi.fn().mockReturnValue(true),
  }
})

vi.mock(import('lib/gotrue'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    auth: {
      ...(actual.auth as any),
      onAuthStateChange: vi.fn(),
    },
  }
})

describe('SupportFormPage', () => {
  beforeEach(() => {
    // Reset window.location.search before each test
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true,
    })

    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: mockOrganizations,
    })

    addAPIMock({
      method: 'get',
      path: '/platform/projects',
      response: mockProjects,
    })

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: mockProjects[0],
    })

    addAPIMock({
      method: 'get',
      path: '/platform/status',
      response: { is_healthy: true } as any,
    })

    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/projects',
      response: ({ params, request }) => {
        const slug = (params as { slug: string }).slug
        const projects = mockProjects.filter((project) => project.organization_slug === slug)

        const url = new URL(request.url)
        const limit = Number(url.searchParams.get('limit') ?? projects.length)
        const offset = Number(url.searchParams.get('offset') ?? 0)
        const sort = url.searchParams.get('sort') ?? 'name_asc'

        const sorted = [...projects].sort((a, b) => {
          switch (sort) {
            case 'name_desc':
              return b.name.localeCompare(a.name)
            default:
              return a.name.localeCompare(b.name)
          }
        })

        const paginated = sorted.slice(offset, offset + limit)

        return HttpResponse.json({
          projects: paginated,
          pagination: {
            count: projects.length,
            limit,
            offset,
          },
        })
      },
    })

    mswServer.use(
      http.get('http://localhost:3000/img/supabase-logo.svg', () => HttpResponse.text(''))
    )
  })

  test('shows system status: healthy', async () => {
    renderSupportFormPage()

    await waitFor(() => {
      expect(
        screen.getByRole('link', {
          name: /all systems operational/i,
        })
      ).toBeInTheDocument()
    })
  })

  test('shows system status: not healthy', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/status',
      response: { is_healthy: false } as any,
    })

    renderSupportFormPage()

    await waitFor(() => {
      expect(
        screen.getByRole('link', {
          name: /incident/i,
        })
      ).toBeInTheDocument()
    })
  })

  test('shows system status: check failed', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/status',
      response: () => HttpResponse.error() as any,
    })

    renderSupportFormPage()

    await waitFor(() => {
      expect(
        screen.getByRole('link', {
          name: /failed/i,
        })
      ).toBeInTheDocument()
    })
  })

  test('loading a URL with a valid project slug prefills the organization and project', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?projectRef=project-3' },
      writable: true,
    })

    renderSupportFormPage()

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Select an organization' })).toHaveTextContent(
        'Organization 1'
      )
      expect(screen.getByRole('combobox', { name: 'Select a project' })).toHaveTextContent(
        'Project 3'
      )
    })
  })

  test('loading a URL with no project slug falls back to first organization and project', async () => {
    renderSupportFormPage()

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Select an organization' })).toHaveTextContent(
        'Organization 1'
      )
      expect(screen.getByRole('combobox', { name: 'Select a project' })).toHaveTextContent(
        'Project 1'
      )
    })
  })

  test('loading a URL with an invalid project slug falls back to first organization and project', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () => HttpResponse.error(),
    })
    Object.defineProperty(window, 'location', {
      value: { search: '?projectRef=project-nonexistent' },
      writable: true,
    })

    renderSupportFormPage()

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Select an organization' })).toHaveTextContent(
        'Organization 1'
      )
      expect(screen.getByRole('combobox', { name: 'Select a project' })).toHaveTextContent(
        'Project 1'
      )
    })
  })

  test('loading a URL with a message prefills the message field', async () => {
    const testMessage = 'This is a test support message from URL'
    Object.defineProperty(window, 'location', {
      value: { search: `?message=${encodeURIComponent(testMessage)}` },
      writable: true,
    })

    renderSupportFormPage()

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/describe the issue/i)).toHaveValue(testMessage)
    })
  })

  test('loading a URL with a subject prefills the subject field', async () => {
    const testSubject = 'Test Subject'
    Object.defineProperty(window, 'location', {
      value: { search: `?subject=${encodeURIComponent(testSubject)}` },
      writable: true,
    })

    renderSupportFormPage()

    await waitFor(() => {
      const subjectField = screen.getByPlaceholderText(/summary of the problem/i)
      expect(subjectField).toHaveValue(testSubject)
    })
  })

  test('loading a URL with a category prefills the category field', async () => {
    const testCategory = 'Problem'
    Object.defineProperty(window, 'location', {
      value: { search: `?category=${encodeURIComponent(testCategory)}` },
      writable: true,
    })

    renderSupportFormPage()

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Select an issue' })).toHaveTextContent(
        'APIs and client libraries'
      )
    })
  })

  test.only('when organization changes, project selector updates to match', async () => {
    renderSupportFormPage()

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Select an organization' })).toHaveTextContent(
        'Organization 1'
      )
      expect(screen.getByRole('combobox', { name: 'Select a project' })).toHaveTextContent(
        'Project 1'
      )
    })

    // Click on the organization selector to open the dropdown
    await userEvent.click(screen.getByRole('combobox', { name: 'Select an organization' }))

    // Click on "Organization 2" option
    await userEvent.click(screen.getByRole('option', { name: 'Organization 2' }))

    // Wait for the organization to change
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Select an organization' })).toHaveTextContent(
        'Organization 2'
      )
    })

    // Wait for the project selector to update with the first project from org-2
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Select a project' })).toHaveTextContent(
        'Project 2'
      )
    })
  })

  test.skip('AIAssistantOption displays when valid project and organization are selected', async () => {
    renderSupportFormPage({
      nuqs: {
        searchParams: {
          projectRef: 'project-1',
          orgSlug: 'org-1',
        },
      },
    })

    await waitFor(
      () => {
        expect(screen.getByText('Try the AI Assistant')).toBeInTheDocument()
      },
      { timeout: 10000 }
    )

    expect(screen.getByRole('link', { name: /Ask AI assistant/i })).toBeInTheDocument()
  })

  test.skip('AIAssistantOption does not display when no organization is selected', async () => {
    renderSupportFormPage({
      nuqs: {
        searchParams: {
          projectRef: 'project-1',
          orgSlug: 'no-org',
        },
      },
    })

    await waitFor(() => {
      expect(screen.queryByText('Try the AI Assistant')).not.toBeInTheDocument()
    })
  })

  test.skip('form has submit button and required fields', async () => {
    renderSupportFormPage({
      nuqs: {
        searchParams: {
          projectRef: 'project-1',
        },
      },
    })

    // Wait for form to load
    await waitFor(
      () => {
        expect(screen.getByText('Project 1')).toBeInTheDocument()
      },
      { timeout: 10000 }
    )

    // Verify form fields exist
    expect(screen.getByPlaceholderText(/summary of the problem/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/describe the issue/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send support request/i })).toBeInTheDocument()
  })

  test.skip('form fields are editable and user can type in them', async () => {
    const user = userEvent.setup()

    renderSupportFormPage({
      nuqs: {
        searchParams: {
          subject: 'Initial Subject',
          message: 'Initial Message',
        },
      },
    })

    // Wait for form fields to be populated from URL
    await waitFor(
      () => {
        const subjectField = screen.getByPlaceholderText(/summary of the problem/i)
        expect(subjectField).toHaveValue('Initial Subject')
      },
      { timeout: 10000 }
    )

    const messageField = screen.getByPlaceholderText(/describe the issue/i)
    expect(messageField).toHaveValue('Initial Message')

    // User can edit fields
    const subjectField = screen.getByPlaceholderText(/summary of the problem/i)
    await user.clear(subjectField)
    await user.type(subjectField, 'Updated Subject')
    expect(subjectField).toHaveValue('Updated Subject')
  })

  test.skip('displays helpful information for direct email support', async () => {
    renderSupportFormPage()

    await waitFor(
      () => {
        expect(screen.getByText(/Having trouble submitting the form/i)).toBeInTheDocument()
      },
      { timeout: 10000 }
    )

    // Check for direct email support info
    expect(screen.getByText('support@supabase.com')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /support@supabase.com/i })).toBeInTheDocument()
  })
})
