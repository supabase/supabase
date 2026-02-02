import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
// End of third-party imports

import { API_URL, BASE_PATH } from 'lib/constants'
import { HttpResponse, http } from 'msw'
import { createMockOrganization, createMockProject } from 'tests/helpers'
import { customRender } from 'tests/lib/custom-render'
import { addAPIMock, mswServer } from 'tests/lib/msw'
import { createMockProfileContext } from 'tests/lib/profile-helpers'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { NO_ORG_MARKER, NO_PROJECT_MARKER } from '../SupportForm.utils'
import { SupportFormPage } from '../SupportFormPage'

type Screen = typeof screen

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

const mockProjects = {
  pagination: {
    count: 3,
    limit: 100,
    offset: 0,
  },
  projects: [
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
  ],
}

const { mockCommitSha, mockCommitTime, mockUseDeploymentCommitQuery } = vi.hoisted(() => {
  const sha = 'mock-studio-commit-sha'
  const commitTime = '2024-01-01T00:00:00Z'

  const createCommitResponse = () => ({
    commitSha: sha,
    commitTime,
  })

  return {
    mockCommitSha: sha,
    mockCommitTime: commitTime,
    mockUseDeploymentCommitQuery: vi.fn().mockReturnValue({ data: createCommitResponse() }),
  }
})

const mockStudioVersion = `SHA ${mockCommitSha} deployed at ${dayjs(mockCommitTime).format('YYYY-MM-DD HH:mm:ss Z')}`

vi.mock('react-inlinesvg', () => ({
  __esModule: true,
  default: () => null,
}))

vi.mock('../support-storage-client', () => ({
  createSupportStorageClient: vi.fn(),
}))

vi.mock(import('lib/breadcrumbs'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getOwnershipOfBreadcrumbSnapshot: vi.fn(),
  }
})

let createSupportStorageClientMock: ReturnType<typeof vi.fn>
let getBreadcrumbSnapshotMock: ReturnType<typeof vi.fn>
let generateAttachmentUrlSpy: ReturnType<typeof vi.fn>

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('data/utils/deployment-commit-query', () => ({
  useDeploymentCommitQuery: mockUseDeploymentCommitQuery,
}))

vi.mock(import('common'), async (importOriginal) => {
  const actual = await importOriginal()
  vi.spyOn((actual as any).gotrueClient, 'getSession').mockResolvedValue({
    data: {
      session: {
        user: {
          id: '00000000-0000-0000-0000-000000000000',
        },
      },
    },
  })
  return {
    ...actual,
    useParams: vi.fn().mockReturnValue({ ref: 'default' }),
    useIsLoggedIn: vi.fn().mockReturnValue(true),
    isFeatureEnabled: vi.fn((feature: any, disabledFeatures: any) => {
      if (typeof feature === 'string') {
        if (feature === 'support:show_client_libraries') {
          return true
        }
        return (actual as any).isFeatureEnabled(feature, disabledFeatures)
      }

      if (Array.isArray(feature)) {
        const result = (actual as any).isFeatureEnabled(feature, disabledFeatures)
        if (feature.includes('support:show_client_libraries')) {
          if (result && typeof result === 'object') {
            return {
              ...result,
              'support:show_client_libraries': true,
            }
          }
        }
        return result
      }

      return (actual as any).isFeatureEnabled(feature, disabledFeatures)
    }),
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

vi.mock(import('lib/constants'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    IS_PLATFORM: true,
  }
})

const renderSupportFormPage = (options?: Parameters<typeof customRender>[1]) =>
  customRender(<SupportFormPage />, {
    profileContext: createMockProfileContext(),
    ...options,
  })

const getStatusLink = (screen: Screen) => {
  const statusLink = screen
    .getAllByRole('link')
    .find((el) => el.getAttribute('href') === 'https://status.supabase.com/')
  expect(statusLink).toBeDefined()
  return statusLink
}

const getOrganizationSelector = (screen: Screen) =>
  screen.getByRole('combobox', { name: 'Select an organization' })

const getProjectSelector = (screen: Screen) =>
  screen.getByRole('combobox', { name: 'Select a project' })

const getSummaryField = (screen: Screen) => screen.getByPlaceholderText(/summary of the problem/i)

const getMessageField = (screen: Screen) => screen.getByPlaceholderText(/describe the issue/i)

const getCategorySelector = (screen: Screen) =>
  screen.getByRole('combobox', { name: 'Select an issue' })

const getSubmitButton = (screen: Screen) =>
  screen.getByRole('button', { name: 'Send support request' })

const selectCategoryOption = async (screen: Screen, optionLabel: string) => {
  await userEvent.click(getCategorySelector(screen))
  const option = await screen.findByRole('option', {
    name: (accessibleName) => accessibleName.toLowerCase().startsWith(optionLabel.toLowerCase()),
  })
  await userEvent.click(option)
}

const getSeveritySelector = (screen: Screen) =>
  screen.getByRole('combobox', { name: 'Select a severity' })

const selectSeverityOption = async (screen: Screen, optionLabel: string) => {
  await userEvent.click(getSeveritySelector(screen))
  const option = await screen.findByRole('option', {
    name: (accessibleName) => accessibleName.toLowerCase().startsWith(optionLabel.toLowerCase()),
  })
  await userEvent.click(option)
}

const getLibrarySelector = (screen: Screen) =>
  screen.getByRole('combobox', { name: 'Select a library' })

const selectLibraryOption = async (screen: Screen, optionLabel: string) => {
  // await waitFor(() => {
  //   expect(() => getLibrarySelector(screen)).not.toThrow()
  // })
  const selector = getLibrarySelector(screen)
  await userEvent.click(selector)
  const option = await screen.findByRole('option', {
    name: (accessibleName) => accessibleName.toLowerCase().startsWith(optionLabel.toLowerCase()),
  })
  await userEvent.click(option)
}

const getDashboardLogsToggle = (screen: Screen, type: 'find' | 'query' = 'find') => {
  const labelMatcher = /dashboard .* log/i
  return type === 'find'
    ? screen.findByRole('switch', { name: labelMatcher })
    : screen.queryByRole('switch', { name: labelMatcher })
}

const getSupportForm = () => {
  const form = document.querySelector<HTMLFormElement>('form#support-form')
  expect(form).not.toBeNull()
  return form!
}

const getAttachmentFileInput = () => {
  const input = getSupportForm().querySelector<HTMLInputElement>(
    'input[type="file"][accept*="image"]'
  )
  expect(input).not.toBeNull()
  return input!
}

const getAttachmentRemoveButtons = (screen: Screen) =>
  screen.queryAllByRole('button', { name: 'Remove attachment' })

const createDeferred = () => {
  let resolve!: () => void
  const promise = new Promise<void>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const createMockLocation = (search = '') => {
  const url = new URL('http://localhost:3000/')
  url.search = search.startsWith('?') || search === '' ? search : `?${search}`
  return {
    href: url.href,
    origin: url.origin,
    protocol: url.protocol,
    host: url.host,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
  }
}

const originalUserAgent = window.navigator.userAgent

describe('SupportFormPage', () => {
  afterEach(() => {
    mockUseDeploymentCommitQuery.mockClear()
    Object.defineProperty(window.navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    })
  })

  beforeEach(async () => {
    mockUseDeploymentCommitQuery.mockReturnValue({
      data: { commitSha: mockCommitSha, commitTime: mockCommitTime },
    })
    const { createSupportStorageClient } = await import('../support-storage-client')
    createSupportStorageClientMock = vi.mocked(createSupportStorageClient)
    createSupportStorageClientMock.mockReset()
    createSupportStorageClientMock.mockReturnValue({
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn(async (path: string) => ({
            data: { path },
            error: null,
          })),
          createSignedUrls: vi.fn(async (paths: string[]) => ({
            data: paths.map((path) => ({
              signedUrl: `https://storage.example.com/${path}`,
              path,
              error: null,
            })),
            error: null,
          })),
        })),
      },
    } as any)

    generateAttachmentUrlSpy = vi.fn()
    mswServer.use(
      http.post('*/rest/v1/rpc/docs_search_fts', async () => {
        return HttpResponse.json([])
      }),
      http.post('*/rest/v1/rpc/docs_search_fts_nimbus', async () => {
        return HttpResponse.json([])
      }),
      http.post('*/functions/v1/search-embeddings', async () => {
        return HttpResponse.json([])
      }),
      http.post('http://localhost:3000/api/generate-attachment-url', async ({ request }) => {
        const body = (await request.json()) as {
          bucket?: string
          filenames?: string[]
        }
        generateAttachmentUrlSpy(body)
        const filenames = body.filenames ?? []
        return HttpResponse.json(
          filenames.map((filename) => `https://storage.example.com/signed/${filename}`)
        )
      })
    )

    const breadcrumbsModule = await import('lib/breadcrumbs')
    getBreadcrumbSnapshotMock = vi.mocked(breadcrumbsModule.getOwnershipOfBreadcrumbSnapshot)
    getBreadcrumbSnapshotMock.mockReset()
    getBreadcrumbSnapshotMock.mockReturnValue([
      {
        timestamp: 1_710_000_000,
        category: 'ui.action',
        message: 'Clicked button',
        level: 'info',
        data: { route: '/project/_/dashboard' },
      },
    ])

    Object.defineProperty(window.navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      configurable: true,
    })
    Object.defineProperty(window, 'location', {
      value: createMockLocation(),
      writable: true,
    })
    Object.defineProperty(window, 'scrollTo', {
      value: vi.fn(),
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
      response: ({ params }) => {
        const { ref } = params as { ref: string }
        const project = mockProjects.projects.find((candidate) => candidate.ref === ref)
        return project
          ? HttpResponse.json(project)
          : HttpResponse.json({ msg: 'Project not found' }, { status: 404 })
      },
    })

    mswServer.use(
      http.get(`${BASE_PATH}/api/incident-status`, () => HttpResponse.json([], { status: 200 }))
    )

    addAPIMock({
      method: 'get',
      path: '/platform/auth/:ref/config',
      response: { SITE_URL: 'https://supabase.com', URI_ALLOW_LIST: '' } as any,
    })

    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/projects',
      response: ({ params, request }) => {
        const slug = (params as { slug: string }).slug
        const projects = mockProjects.projects.filter(
          (project) => project.organization_slug === slug
        )

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
      expect(getStatusLink(screen)).toHaveTextContent('All systems operational')
    })
  })

  test('shows system status: not healthy', async () => {
    mswServer.use(
      http.get(`${BASE_PATH}/api/incident-status`, () =>
        HttpResponse.json(
          [
            {
              id: 'z3qp8rln72pl',
              active_since: '2026-01-26T10:30:00Z',
              impact: 'critical',
              status: 'in_progress',
              name: 'Test incident',
            },
          ],
          { status: 200 }
        )
      )
    )

    renderSupportFormPage()

    await waitFor(() => {
      expect(getStatusLink(screen)).toHaveTextContent('Active incident ongoing')
    })
  })

  test('shows system status: check failed', async () => {
    mswServer.use(
      http.get(`${BASE_PATH}/api/incident-status`, () =>
        HttpResponse.json({ msg: 'Status service unavailable' }, { status: 500 })
      )
    )

    renderSupportFormPage()

    await waitFor(() => {
      expect(getStatusLink(screen)).toHaveTextContent('Failed to check status')
    })
  })

  test('loading a URL with a valid project slug prefills the organization and project', async () => {
    Object.defineProperty(window, 'location', {
      value: createMockLocation('?projectRef=project-3'),
      writable: true,
    })

    renderSupportFormPage()

    await waitFor(() => {
      expect(getOrganizationSelector(screen)).toHaveTextContent('Organization 1')
      expect(screen.getByRole('combobox', { name: 'Select a project' })).toHaveTextContent(
        'Project 3'
      )
    })
  })

  test('loading a URL with no project slug falls back to first organization and project', async () => {
    renderSupportFormPage()

    await waitFor(() => {
      expect(getOrganizationSelector(screen)).toHaveTextContent('Organization 1')
      expect(getProjectSelector(screen)).toHaveTextContent('Project 1')
    })
  })

  test('loading a URL with explicit no project ref falls back to first organization and no project', async () => {
    Object.defineProperty(window, 'location', {
      value: createMockLocation(`?projectRef=${NO_PROJECT_MARKER}`),
      writable: true,
    })

    renderSupportFormPage()

    await waitFor(() => {
      expect(getOrganizationSelector(screen)).toHaveTextContent('Organization 1')
      expect(getProjectSelector(screen)).toHaveTextContent('No specific project')
    })
  })

  test('loading a URL with an invalid project slug falls back to first organization and project', async () => {
    mswServer.use(
      http.get(`${API_URL}/platform/projects/:ref`, () =>
        HttpResponse.json({ msg: 'Project not found' }, { status: 404 })
      )
    )
    Object.defineProperty(window, 'location', {
      value: createMockLocation('?projectRef=project-nonexistent'),
      writable: true,
    })

    renderSupportFormPage()

    await waitFor(() => {
      expect(getOrganizationSelector(screen)).toHaveTextContent('Organization 1')
      expect(getProjectSelector(screen)).toHaveTextContent('Project 1')
    })
  })

  test('loading a URL with a message prefills the message field', async () => {
    const testMessage = 'This is a test support message from URL'
    Object.defineProperty(window, 'location', {
      value: createMockLocation(`?message=${encodeURIComponent(testMessage)}`),
      writable: true,
    })

    renderSupportFormPage()

    await waitFor(() => {
      expect(getMessageField(screen)).toHaveValue(testMessage)
    })
  })

  test('loading a URL with a subject prefills the subject field', async () => {
    const testSubject = 'Test Subject'
    Object.defineProperty(window, 'location', {
      value: createMockLocation(`?subject=${encodeURIComponent(testSubject)}`),
      writable: true,
    })

    renderSupportFormPage()

    await waitFor(() => {
      const subjectField = getSummaryField(screen)
      expect(subjectField).toHaveValue(testSubject)
    })
  })

  test('loading a URL with a category prefills the category field', async () => {
    const testCategory = 'Problem'
    Object.defineProperty(window, 'location', {
      value: createMockLocation(`?category=${encodeURIComponent(testCategory)}`),
      writable: true,
    })

    renderSupportFormPage()

    await waitFor(() => {
      expect(getCategorySelector(screen)).toHaveTextContent('APIs and client libraries')
    })
  })

  test('loading a URL with a category prefills the category field (case-insensitive)', async () => {
    const testCategory = 'dashboard_bug'
    Object.defineProperty(window, 'location', {
      value: createMockLocation(`?category=${encodeURIComponent(testCategory)}`),
      writable: true,
    })

    renderSupportFormPage()

    await waitFor(() => {
      expect(getCategorySelector(screen)).toHaveTextContent('Dashboard bug')
    })
  })

  test('loading a URL with an invalid category gracefully falls back', async () => {
    const testCategory = 'Invalid'
    Object.defineProperty(window, 'location', {
      value: createMockLocation(`?category=${encodeURIComponent(testCategory)}`),
      writable: true,
    })

    renderSupportFormPage()

    await waitFor(() => {
      expect(getCategorySelector(screen)).toHaveTextContent('Select an issue')
    })
  })

  test('loading a URL with multiple initial fields fills them all in', async () => {
    const testCategory = 'Problem'
    const testSubject = 'Test Subject'
    Object.defineProperty(window, 'location', {
      value: createMockLocation(
        `?category=${encodeURIComponent(testCategory)}&subject=${encodeURIComponent(testSubject)}`
      ),
      writable: true,
    })

    renderSupportFormPage()

    await waitFor(() => {
      expect(getCategorySelector(screen)).toHaveTextContent('APIs and client libraries')
      expect(getSummaryField(screen)).toHaveValue(testSubject)
    })
  })

  test('includes Sentry issue ID from URL in submission payload', async () => {
    const sentryIssueId = 'mock-sentry-id'

    const submitSpy = vi.fn()
    addAPIMock({
      method: 'post',
      path: '/platform/feedback/send',
      response: async ({ request }) => {
        submitSpy(await request.json())
        return HttpResponse.json({ ok: true })
      },
    })

    Object.defineProperty(window, 'location', {
      value: createMockLocation(`?sid=${encodeURIComponent(sentryIssueId)}`),
      writable: true,
    })

    renderSupportFormPage()

    await waitFor(
      () => {
        expect(getOrganizationSelector(screen)).toHaveTextContent('Organization 1')
        expect(getProjectSelector(screen)).toHaveTextContent('Project 1')
      },
      { timeout: 5_000 }
    )

    await selectCategoryOption(screen, 'Dashboard bug')
    await waitFor(() => {
      expect(getCategorySelector(screen)).toHaveTextContent('Dashboard bug')
    })

    await userEvent.type(getSummaryField(screen), 'Dashboard stopped loading')
    await userEvent.type(getMessageField(screen), 'The dashboard page loads blank after login')

    await userEvent.click(getSubmitButton(screen))

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledTimes(1)
    })
    expect(submitSpy.mock.calls[0]?.[0]?.dashboardSentryIssueId).toBe(sentryIssueId)
  }, 10_000)

  test('includes initial error message from URL in submission payload', async () => {
    const initialError = 'failed to fetch user data'
    const messageBody = 'The dashboard page loads blank after login'

    const submitSpy = vi.fn()
    addAPIMock({
      method: 'post',
      path: '/platform/feedback/send',
      response: async ({ request }) => {
        submitSpy(await request.json())
        return HttpResponse.json({ ok: true })
      },
    })

    Object.defineProperty(window, 'location', {
      value: createMockLocation(`?error=${encodeURIComponent(initialError)}`),
      writable: true,
    })

    renderSupportFormPage()

    await waitFor(
      () => {
        expect(getOrganizationSelector(screen)).toHaveTextContent('Organization 1')
        expect(getProjectSelector(screen)).toHaveTextContent('Project 1')
      },
      { timeout: 5_000 }
    )

    await selectCategoryOption(screen, 'Dashboard bug')
    await waitFor(() => {
      expect(getCategorySelector(screen)).toHaveTextContent('Dashboard bug')
    })

    await userEvent.type(getSummaryField(screen), 'Dashboard stopped loading')
    await userEvent.type(getMessageField(screen), messageBody)

    await userEvent.click(getSubmitButton(screen))

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledTimes(1)
    })

    const payload = submitSpy.mock.calls[0]?.[0]
    expect(payload?.message).toMatch(initialError)
  }, 10_000)

  test('submits support request with problem category, library, and affected services', async () => {
    const submitSpy = vi.fn()
    addAPIMock({
      method: 'post',
      path: '/platform/feedback/send',
      response: async ({ request }) => {
        submitSpy(await request.json())
        return HttpResponse.json({ ok: true })
      },
    })

    addAPIMock({
      method: 'get',
      path: '/platform/auth/:ref/config',
      response: ({ params }) => {
        const { ref } = params as { ref: string }
        return HttpResponse.json({
          SITE_URL: `https://${ref}.example.com`,
          URI_ALLOW_LIST: `https://${ref}.example.com/callbacks`,
        } as any)
      },
    })

    renderSupportFormPage()

    await waitFor(
      () => {
        expect(getOrganizationSelector(screen)).toHaveTextContent('Organization 1')
        expect(getProjectSelector(screen)).toHaveTextContent('Project 1')
      },
      { timeout: 5_000 }
    )

    await selectCategoryOption(screen, 'APIs and client libraries')
    await waitFor(() => {
      expect(getCategorySelector(screen)).toHaveTextContent('APIs and client libraries')
    })

    await selectSeverityOption(screen, 'High')
    await waitFor(() => {
      expect(getSeveritySelector(screen)).toHaveTextContent('High')
    })

    await selectLibraryOption(screen, 'JavaScript')
    await waitFor(() => {
      expect(getLibrarySelector(screen)).toHaveTextContent('JavaScript')
    })

    const summaryField = getSummaryField(screen)
    await userEvent.clear(summaryField)
    await userEvent.type(summaryField, 'API requests failing in production')

    const messageField = getMessageField(screen)
    await userEvent.clear(messageField)
    await userEvent.type(messageField, 'Requests return status 500 when calling the RPC endpoint')

    const supportAccessToggle = screen.getByRole('switch', {
      name: /allow support access to your project/i,
    })
    expect(supportAccessToggle).toBeChecked()
    await userEvent.click(supportAccessToggle)
    expect(supportAccessToggle).not.toBeChecked()

    await userEvent.click(getSubmitButton(screen))

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledTimes(1)
    })

    const payload = submitSpy.mock.calls[0]?.[0]
    expect(payload).toMatchObject({
      subject: 'API requests failing in production',
      category: 'Problem',
      severity: 'High',
      projectRef: 'project-1',
      organizationSlug: 'org-1',
      library: 'javascript',
      affectedServices: '',
      allowSupportAccess: false,
      verified: true,
      tags: ['dashboard-support-form'],
      siteUrl: 'https://project-1.example.com',
      additionalRedirectUrls: 'https://project-1.example.com/callbacks',
      browserInformation: 'Chrome',
      dashboardStudioVersion: mockStudioVersion,
    })
    expect(payload.message).toBe('Requests return status 500 when calling the RPC endpoint')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /support request sent/i })).toBeInTheDocument()
    })
  }, 10_000)

  test('submits urgent login issues ticket for a different organization', async () => {
    const submitSpy = vi.fn()

    addAPIMock({
      method: 'post',
      path: '/platform/feedback/send',
      response: async ({ request }) => {
        submitSpy(await request.json())
        return HttpResponse.json({ ok: true })
      },
    })

    addAPIMock({
      method: 'get',
      path: '/platform/auth/:ref/config',
      response: ({ params }) => {
        const { ref } = params as { ref: string }
        return HttpResponse.json({
          SITE_URL: `https://${ref}.supabase.dev`,
          URI_ALLOW_LIST: `https://${ref}.supabase.dev/redirect`,
        } as any)
      },
    })

    renderSupportFormPage()

    await waitFor(() => {
      expect(getOrganizationSelector(screen)).toHaveTextContent('Organization 1')
    })

    await userEvent.click(getOrganizationSelector(screen))
    await userEvent.click(await screen.findByRole('option', { name: 'Organization 2' }))

    await waitFor(() => {
      expect(getOrganizationSelector(screen)).toHaveTextContent('Organization 2')
      expect(getProjectSelector(screen)).toHaveTextContent('Project 2')
    })

    await selectCategoryOption(screen, 'Issues with logging in')
    await waitFor(() => {
      expect(getCategorySelector(screen)).toHaveTextContent('Issues with logging in')
    })

    await selectSeverityOption(screen, 'Urgent')
    await waitFor(() => {
      expect(getSeveritySelector(screen)).toHaveTextContent('Urgent')
    })

    const summaryField = getSummaryField(screen)
    await userEvent.clear(summaryField)
    await userEvent.type(summaryField, 'Cannot log in to dashboard')

    const messageField = getMessageField(screen)
    await userEvent.clear(messageField)
    await userEvent.type(messageField, 'MFA challenge fails with an unknown error code')

    await userEvent.click(getSubmitButton(screen))

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledTimes(1)
    })

    const payload = submitSpy.mock.calls[0]?.[0]
    expect(payload).toMatchObject({
      subject: 'Cannot log in to dashboard',
      category: 'Login_issues',
      severity: 'Urgent',
      projectRef: 'project-2',
      organizationSlug: 'org-2',
      library: '',
      affectedServices: '',
      allowSupportAccess: true,
      verified: true,
      tags: ['dashboard-support-form'],
      siteUrl: 'https://project-2.supabase.dev',
      additionalRedirectUrls: 'https://project-2.supabase.dev/redirect',
      browserInformation: 'Chrome',
      dashboardStudioVersion: mockStudioVersion,
    })
    expect(payload.message).toBe('MFA challenge fails with an unknown error code')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /support request sent/i })).toBeInTheDocument()
    })
  }, 10_000)

  test('submits database unresponsive ticket with initial error', async () => {
    const submitSpy = vi.fn()

    addAPIMock({
      method: 'post',
      path: '/platform/feedback/send',
      response: async ({ request }) => {
        submitSpy(await request.json())
        return HttpResponse.json({ ok: true })
      },
    })

    addAPIMock({
      method: 'get',
      path: '/platform/auth/:ref/config',
      response: ({ params }) => {
        const { ref } = params as { ref: string }
        return HttpResponse.json({
          SITE_URL: `https://${ref}.apps.supabase.co`,
          URI_ALLOW_LIST: `https://${ref}.apps.supabase.co/auth`,
        } as any)
      },
    })

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: ({ params }) => {
        const { ref } = params as { ref: string }
        const project = mockProjects.projects.find((candidate) => candidate.ref === ref)
        return project
          ? HttpResponse.json(project)
          : HttpResponse.json({ msg: 'Project not found' }, { status: 404 })
      },
    })

    Object.defineProperty(window, 'location', {
      value: createMockLocation('?projectRef=project-3&error=Connection timeout detected'),
      writable: true,
    })

    renderSupportFormPage()

    await waitFor(() => {
      expect(getProjectSelector(screen)).toHaveTextContent('Project 3')
      expect(getOrganizationSelector(screen)).toHaveTextContent('Organization 1')
    })

    await selectCategoryOption(screen, 'Database unresponsive')
    await waitFor(() => {
      expect(getCategorySelector(screen)).toHaveTextContent('Database unresponsive')
    })

    await selectSeverityOption(screen, 'Normal')
    await waitFor(() => {
      expect(getSeveritySelector(screen)).toHaveTextContent('Normal')
    })

    const summaryField = getSummaryField(screen)
    await userEvent.clear(summaryField)
    await userEvent.type(summaryField, 'Database unreachable after upgrade')

    const messageField = getMessageField(screen)
    await userEvent.clear(messageField)
    await userEvent.type(messageField, 'Connections time out after 30 seconds')

    const supportAccessToggle = screen.getByRole('switch', {
      name: /allow support access to your project/i,
    })
    expect(supportAccessToggle).toBeChecked()

    await userEvent.click(getSubmitButton(screen))

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledTimes(1)
    })

    const payload = submitSpy.mock.calls[0]?.[0]
    expect(payload).toMatchObject({
      subject: 'Database unreachable after upgrade',
      category: 'Database_unresponsive',
      severity: 'Normal',
      projectRef: 'project-3',
      organizationSlug: 'org-1',
      library: '',
      affectedServices: '',
      allowSupportAccess: true,
      verified: true,
      tags: ['dashboard-support-form'],
      siteUrl: 'https://project-3.apps.supabase.co',
      additionalRedirectUrls: 'https://project-3.apps.supabase.co/auth',
      browserInformation: 'Chrome',
      dashboardStudioVersion: mockStudioVersion,
    })
    expect(payload.message).toBe(
      'Connections time out after 30 seconds\n\nError: Connection timeout detected'
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /support request sent/i })).toBeInTheDocument()
    })
  }, 10_000)

  test('when organization changes, project selector updates to match', async () => {
    renderSupportFormPage()

    await waitFor(() => {
      expect(getOrganizationSelector(screen)).toHaveTextContent('Organization 1')
      expect(getProjectSelector(screen)).toHaveTextContent('Project 1')
    })

    await userEvent.click(getOrganizationSelector(screen))
    await userEvent.click(screen.getByRole('option', { name: 'Organization 2' }))
    await waitFor(() => {
      expect(getOrganizationSelector(screen)).toHaveTextContent('Organization 2')
    })

    await waitFor(() => {
      expect(getProjectSelector(screen)).toHaveTextContent('Project 2')
    })
  })

  test('AI Assistant suggestion displays when valid project and organization are selected', async () => {
    renderSupportFormPage()

    await waitFor(() => {
      expect(screen.getByText('Try Supabase Assistant')).toBeInTheDocument()
    })
  })

  test('can upload attachments', async () => {
    const url = URL as unknown as {
      createObjectURL?: (obj: Blob) => string
      revokeObjectURL?: (url: string) => void
    }
    const originalCreateObjectURL = url.createObjectURL
    const originalRevokeObjectURL = url.revokeObjectURL

    let urlIndex = 0
    const createObjectURLMock = vi.fn(() => {
      urlIndex += 1
      return `blob:mock-url-${urlIndex}`
    })
    const revokeObjectURLMock = vi.fn()
    url.createObjectURL = createObjectURLMock
    url.revokeObjectURL = revokeObjectURLMock

    let unmount: (() => void) | undefined
    try {
      const renderResult = renderSupportFormPage()
      unmount = renderResult.unmount

      await waitFor(() => {
        expect(getOrganizationSelector(screen)).toHaveTextContent('Organization 1')
      })

      const fileInput = getAttachmentFileInput()
      const firstFile = new File(['first file'], 'first.png', { type: 'image/png' })
      const secondFile = new File(['second file'], 'second.jpg', { type: 'image/jpeg' })
      await userEvent.upload(fileInput, [firstFile, secondFile])

      await waitFor(() => {
        expect(getAttachmentRemoveButtons(screen)).toHaveLength(2)
      })
      expect(createObjectURLMock).toHaveBeenCalledTimes(2)

      const firstRemoveButton = getAttachmentRemoveButtons(screen)[0]
      await userEvent.click(firstRemoveButton)

      await waitFor(() => {
        expect(getAttachmentRemoveButtons(screen)).toHaveLength(1)
      })
      expect(revokeObjectURLMock).toHaveBeenCalled()

      const thirdFile = new File(['third file'], 'third.png', { type: 'image/png' })
      await userEvent.upload(getAttachmentFileInput(), thirdFile)

      await waitFor(() => {
        expect(getAttachmentRemoveButtons(screen)).toHaveLength(2)
      })

      expect(createObjectURLMock).toHaveBeenCalled()
    } finally {
      unmount?.()
      url.createObjectURL = originalCreateObjectURL
      url.revokeObjectURL = originalRevokeObjectURL
    }
  })

  test('cannot submit form again while it is submitting', async () => {
    const submission = createDeferred()
    const submitSpy = vi.fn()

    addAPIMock({
      method: 'post',
      path: '/platform/feedback/send',
      response: async () => {
        submitSpy()
        await submission.promise
        return HttpResponse.json({ ok: true })
      },
    })

    renderSupportFormPage()

    try {
      await waitFor(() => {
        expect(getOrganizationSelector(screen)).toHaveTextContent('Organization 1')
        expect(getProjectSelector(screen)).toHaveTextContent('Project 1')
      })

      await selectCategoryOption(screen, 'Dashboard bug')
      await waitFor(() => {
        expect(getCategorySelector(screen)).toHaveTextContent('Dashboard bug')
      })
      await userEvent.type(getSummaryField(screen), 'Unable to connect to database')
      await userEvent.type(getMessageField(screen), 'Connections time out after 30 seconds')

      const submitButton = getSubmitButton(screen)
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(submitSpy).toHaveBeenCalledTimes(1)
      })

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })

      await userEvent.click(submitButton)
      expect(submitSpy).toHaveBeenCalledTimes(1)
    } finally {
      submission.resolve()
      await waitFor(() => {
        expect(submitSpy).toHaveBeenCalledTimes(1)
      })
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /support request sent/i })).toBeInTheDocument()
      })
    }
  }, 10_000)

  test('shows dashboard logs toggle only for Dashboard bug issues', async () => {
    renderSupportFormPage()

    await waitFor(() => {
      expect(getOrganizationSelector(screen)).toHaveTextContent('Organization 1')
    })

    expect(getDashboardLogsToggle(screen, 'query')).not.toBeInTheDocument()

    await selectCategoryOption(screen, 'Dashboard bug')
    await waitFor(() => {
      expect(getCategorySelector(screen)).toHaveTextContent('Dashboard bug')
    })

    const dashboardLogToggle = await getDashboardLogsToggle(screen)
    expect(dashboardLogToggle).toBeChecked()

    await selectCategoryOption(screen, 'APIs and client libraries')
    await waitFor(() => {
      expect(getCategorySelector(screen)).toHaveTextContent('APIs and client libraries')
    })
    await waitFor(() => {
      expect(getDashboardLogsToggle(screen, 'query')).not.toBeInTheDocument()
    })

    await selectCategoryOption(screen, 'Dashboard bug')
    await waitFor(() => {
      expect(getCategorySelector(screen)).toHaveTextContent('Dashboard bug')
    })
    const dashboardLogToggleAgain = await getDashboardLogsToggle(screen)
    expect(dashboardLogToggleAgain).toBeChecked()
  })

  test('skips dashboard log upload when toggle is disabled', async () => {
    const submitSpy = vi.fn()
    const upload = vi.fn(async () => ({
      data: { path: 'dashboard-logs/mock.log.json' },
      error: null,
    }))
    const createSignedUrls = vi.fn(async (paths: string[]) => ({
      data: paths.map((path) => ({
        signedUrl: `https://storage.example.com/${path}`,
        path,
        error: null,
      })),
      error: null,
    }))

    createSupportStorageClientMock.mockReturnValue({
      storage: {
        from: vi.fn(() => ({
          upload,
          createSignedUrls,
        })),
      },
    } as any)

    addAPIMock({
      method: 'post',
      path: '/platform/feedback/send',
      response: async ({ request }) => {
        submitSpy(await request.json())
        return HttpResponse.json({ ok: true })
      },
    })

    renderSupportFormPage()

    await waitFor(() => {
      expect(getOrganizationSelector(screen)).toHaveTextContent('Organization 1')
    })

    await selectCategoryOption(screen, 'Dashboard bug')
    await waitFor(() => {
      expect(getCategorySelector(screen)).toHaveTextContent('Dashboard bug')
    })

    const dashboardLogToggle = await getDashboardLogsToggle(screen)
    expect(dashboardLogToggle).toBeChecked()
    await userEvent.click(dashboardLogToggle!)
    expect(dashboardLogToggle).not.toBeChecked()

    await userEvent.type(getSummaryField(screen), 'Dashboard charts crashing')
    await userEvent.type(getMessageField(screen), 'Charts throw error on load')

    await userEvent.click(getSubmitButton(screen))

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledTimes(1)
    })

    expect(upload).not.toHaveBeenCalled()
    expect(createSignedUrls).not.toHaveBeenCalled()

    const payload = submitSpy.mock.calls[0]?.[0]
    expect(payload.message).toContain('Charts throw error on load')
    expect(payload.message).not.toContain('Dashboard logs:')
  })

  test('skips dashboard log upload when toggle hidden', async () => {
    const submitSpy = vi.fn()
    const upload = vi.fn(async () => ({
      data: { path: 'dashboard-logs/mock.log.json' },
      error: null,
    }))
    const createSignedUrls = vi.fn(async (paths: string[]) => ({
      data: paths.map((path) => ({
        signedUrl: `https://storage.example.com/${path}`,
        path,
        error: null,
      })),
      error: null,
    }))

    createSupportStorageClientMock.mockReturnValue({
      storage: {
        from: vi.fn(() => ({
          upload,
          createSignedUrls,
        })),
      },
    } as any)

    addAPIMock({
      method: 'post',
      path: '/platform/feedback/send',
      response: async ({ request }) => {
        submitSpy(await request.json())
        return HttpResponse.json({ ok: true })
      },
    })

    renderSupportFormPage()

    await waitFor(() => {
      expect(getOrganizationSelector(screen)).toHaveTextContent('Organization 1')
    })

    await selectCategoryOption(screen, 'Database unresponsive')
    await waitFor(() => {
      expect(getCategorySelector(screen)).toHaveTextContent('Database unresponsive')
    })

    expect(getDashboardLogsToggle(screen, 'query')).not.toBeInTheDocument()

    await userEvent.type(getSummaryField(screen), 'Dashboard charts crashing')
    await userEvent.type(getMessageField(screen), 'Charts throw error on load')

    await userEvent.click(getSubmitButton(screen))

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledTimes(1)
    })

    expect(upload).not.toHaveBeenCalled()
    expect(createSignedUrls).not.toHaveBeenCalled()

    const payload = submitSpy.mock.calls[0]?.[0]
    expect(payload.message).toContain('Charts throw error on load')
    expect(payload.message).not.toContain('Dashboard logs:')
  })

  test('uploads dashboard logs when enabled and appends link to message', async () => {
    const submitSpy = vi.fn()
    const upload = vi.fn(async (path: string) => ({ data: { path }, error: null }))
    const createSignedUrls = vi.fn(async (paths: string[], _expiry: number) => ({
      data: paths.map((path) => ({
        signedUrl: `https://storage.example.com/signed/${path}`,
        path,
        error: null,
      })),
      error: null,
    }))

    createSupportStorageClientMock.mockReturnValue({
      storage: {
        from: vi.fn(() => ({
          upload,
          createSignedUrls,
        })),
      },
    } as any)

    addAPIMock({
      method: 'post',
      path: '/platform/feedback/send',
      response: async ({ request }) => {
        submitSpy(await request.json())
        return HttpResponse.json({ ok: true })
      },
    })

    renderSupportFormPage()

    await waitFor(() => {
      expect(getOrganizationSelector(screen)).toHaveTextContent('Organization 1')
    })

    await selectCategoryOption(screen, 'Dashboard bug')
    await waitFor(() => {
      expect(getCategorySelector(screen)).toHaveTextContent('Dashboard bug')
    })

    const dashboardLogToggle = await screen.findByRole('switch', {
      name: /include dashboard activity log/i,
    })
    expect(dashboardLogToggle).toBeChecked()

    await userEvent.type(getSummaryField(screen), 'Dashboard navigation broken')
    await userEvent.type(
      getMessageField(screen),
      'Navigation menu does not respond after latest deploy'
    )

    await userEvent.click(getSubmitButton(screen))

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledTimes(1)
    })

    expect(upload).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(generateAttachmentUrlSpy).toHaveBeenCalledTimes(1)
    })
    expect(generateAttachmentUrlSpy.mock.calls[0]?.[0]).toMatchObject({
      bucket: 'dashboard-logs',
    })

    const payload = submitSpy.mock.calls[0]?.[0]
    expect(payload.message).toBe('Navigation menu does not respond after latest deploy')
    expect(payload.dashboardLogs).toMatch(/^https:\/\/storage\.example\.com\/signed\/.+\.json$/)
    expect(payload.dashboardStudioVersion).toBe(mockStudioVersion)
  })

  test('shows toast on submission error and allows form re-editing and resubmission', async () => {
    const submitSpy = vi.fn()
    const toastErrorSpy = vi.fn()
    const toastSuccessSpy = vi.fn()

    const { toast } = await import('sonner')
    vi.mocked(toast.error).mockImplementation(toastErrorSpy)
    vi.mocked(toast.success).mockImplementation(toastSuccessSpy)

    const errorMessage = 'Network error: Unable to reach server'

    // First attempt: return an error
    addAPIMock({
      method: 'post',
      path: '/platform/feedback/send',
      response: async () => {
        return HttpResponse.json({ message: errorMessage }, { status: 500 })
      },
    })

    renderSupportFormPage()

    await waitFor(() => {
      expect(getOrganizationSelector(screen)).toHaveTextContent('Organization 1')
      expect(getProjectSelector(screen)).toHaveTextContent('Project 1')
    })

    await selectCategoryOption(screen, 'Dashboard bug')
    await waitFor(() => {
      expect(getCategorySelector(screen)).toHaveTextContent('Dashboard bug')
    })

    await userEvent.type(getSummaryField(screen), 'Cannot access settings')
    await userEvent.type(getMessageField(screen), 'Settings page shows 500 error')

    const submitButton = getSubmitButton(screen)
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(toastErrorSpy).toHaveBeenCalled()
    })
    expect(toastErrorSpy.mock.calls[0]?.[0]).toMatch(/Failed to submit support ticket/)

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })

    addAPIMock({
      method: 'post',
      path: '/platform/feedback/send',
      response: async ({ request }) => {
        submitSpy(await request.json())
        return HttpResponse.json({ ok: true })
      },
    })

    const messageField = getMessageField(screen)
    await userEvent.clear(messageField)
    await userEvent.type(messageField, 'Settings page shows 500 error - updated description')

    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledTimes(1)
    })

    const payload = submitSpy.mock.calls[0]?.[0]
    expect(payload.subject).toBe('Cannot access settings')
    expect(payload.message).toBe('Settings page shows 500 error - updated description')
    expect(payload.dashboardLogs).toMatch(/^https:\/\/storage\.example\.com\/signed\/.+\.json$/)
    expect(payload.dashboardStudioVersion).toBe(mockStudioVersion)

    await waitFor(() => {
      expect(toastSuccessSpy).toHaveBeenCalledWith('Support request sent. Thank you!')
    })
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /support request sent/i })).toBeInTheDocument()
    })
  }, 10_000)

  test('submits support request with attachments and includes attachment URLs in message', async () => {
    const submitSpy = vi.fn()

    // Mock URL.createObjectURL and revokeObjectURL
    const url = URL as unknown as {
      createObjectURL?: (obj: Blob) => string
      revokeObjectURL?: (url: string) => void
    }
    const originalCreateObjectURL = url.createObjectURL
    const originalRevokeObjectURL = url.revokeObjectURL

    let urlIndex = 0
    const createObjectURLMock = vi.fn(() => {
      urlIndex += 1
      return `blob:mock-url-${urlIndex}`
    })
    const revokeObjectURLMock = vi.fn()
    url.createObjectURL = createObjectURLMock
    url.revokeObjectURL = revokeObjectURLMock

    // Mock the storage upload and createSignedUrls endpoints
    const signedUrls = [
      'https://storage.example.com/signed/file1.png?token=abc123',
      'https://storage.example.com/signed/file2.jpg?token=def456',
    ]

    const mockStorageClient = {
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn(async (path: string) => ({
            data: { Id: path, Key: path, path },
            error: null,
          })),
        })),
      },
    }

    createSupportStorageClientMock.mockReturnValue(mockStorageClient as any)

    mswServer.use(
      http.post('http://localhost:3000/api/generate-attachment-url', async ({ request }) => {
        const { filenames } = (await request.json()) as { filenames: string[] }
        const urls = filenames.map((_, index) => signedUrls[index] ?? '')
        return HttpResponse.json(urls)
      })
    )

    addAPIMock({
      method: 'post',
      path: '/platform/feedback/send',
      response: async ({ request }) => {
        submitSpy(await request.json())
        return HttpResponse.json({ ok: true })
      },
    })

    addAPIMock({
      method: 'get',
      path: '/platform/auth/:ref/config',
      response: ({ params }) => {
        const { ref } = params as { ref: string }
        return HttpResponse.json({
          SITE_URL: `https://${ref}.example.com`,
          URI_ALLOW_LIST: `https://${ref}.example.com/auth`,
        } as any)
      },
    })

    let unmount: (() => void) | undefined
    try {
      const renderResult = renderSupportFormPage()
      unmount = renderResult.unmount

      await waitFor(() => {
        expect(getOrganizationSelector(screen)).toHaveTextContent('Organization 1')
        expect(getProjectSelector(screen)).toHaveTextContent('Project 1')
      })

      await selectCategoryOption(screen, 'Database unresponsive')
      await waitFor(() => {
        expect(getCategorySelector(screen)).toHaveTextContent('Database unresponsive')
      })

      await selectSeverityOption(screen, 'High')
      await waitFor(() => {
        expect(getSeveritySelector(screen)).toHaveTextContent('High')
      })

      const summaryField = getSummaryField(screen)
      await userEvent.clear(summaryField)
      await userEvent.type(summaryField, 'Query timeouts after maintenance')

      const messageField = getMessageField(screen)
      await userEvent.clear(messageField)
      await userEvent.type(
        messageField,
        'All queries timing out after scheduled maintenance window'
      )

      const fileInput = getAttachmentFileInput()
      const firstFile = new File(['screenshot 1'], 'error-screenshot.png', { type: 'image/png' })
      const secondFile = new File(['screenshot 2'], 'logs-screenshot.jpg', { type: 'image/jpeg' })
      await userEvent.upload(fileInput, [firstFile, secondFile])

      await waitFor(() => {
        expect(getAttachmentRemoveButtons(screen)).toHaveLength(2)
      })

      const supportAccessToggle = screen.getByRole('switch', {
        name: /allow support access to your project/i,
      })
      expect(supportAccessToggle).toBeChecked()

      await userEvent.click(getSubmitButton(screen))

      await waitFor(() => {
        expect(submitSpy).toHaveBeenCalledTimes(1)
      })

      const payload = submitSpy.mock.calls[0]?.[0]
      expect(payload).toMatchObject({
        subject: 'Query timeouts after maintenance',
        category: 'Database_unresponsive',
        severity: 'High',
        projectRef: 'project-1',
        organizationSlug: 'org-1',
        library: '',
        affectedServices: '',
        allowSupportAccess: true,
        verified: true,
        tags: ['dashboard-support-form'],
        siteUrl: 'https://project-1.example.com',
        additionalRedirectUrls: 'https://project-1.example.com/auth',
        browserInformation: 'Chrome',
      })

      // Verify that attachment URLs are included in the message
      expect(payload.message).toContain('All queries timing out after scheduled maintenance window')
      expect(payload.message).toContain(signedUrls[0])
      expect(payload.message).toContain(signedUrls[1])

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /support request sent/i })).toBeInTheDocument()
      })
    } finally {
      unmount?.()
      url.createObjectURL = originalCreateObjectURL
      url.revokeObjectURL = originalRevokeObjectURL
      createSupportStorageClientMock.mockReset()
    }
  }, 10_000)

  test('can submit form with no organizations and no projects', async () => {
    const submitSpy = vi.fn()

    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: [],
    })

    addAPIMock({
      method: 'get',
      path: '/platform/projects',
      response: { pagination: { count: 0, limit: 100, offset: 0 }, projects: [] },
    })

    addAPIMock({
      method: 'post',
      path: '/platform/feedback/send',
      response: async ({ request }) => {
        submitSpy(await request.json())
        return HttpResponse.json({ ok: true })
      },
    })

    renderSupportFormPage()

    await waitFor(() => {
      expect(getOrganizationSelector(screen)).toHaveTextContent('No specific organization')
    })
    await waitFor(() => {
      expect(getProjectSelector(screen)).toHaveTextContent('No specific project')
    })

    await selectCategoryOption(screen, 'Dashboard bug')
    await waitFor(() => {
      expect(getCategorySelector(screen)).toHaveTextContent('Dashboard bug')
    })

    const dashboardLogToggle = await getDashboardLogsToggle(screen)
    expect(dashboardLogToggle).toBeChecked()
    await userEvent.click(dashboardLogToggle!)
    expect(dashboardLogToggle).not.toBeChecked()

    await userEvent.type(getSummaryField(screen), 'Cannot access my account')
    await userEvent.type(getMessageField(screen), 'I need help accessing my Supabase account')

    await userEvent.click(getSubmitButton(screen))

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledTimes(1)
    })

    const payload = submitSpy.mock.calls[0]?.[0]
    expect(payload).toMatchObject({
      subject: 'Cannot access my account',
      category: 'Dashboard_bug',
      projectRef: NO_PROJECT_MARKER,
      organizationSlug: NO_ORG_MARKER,
      library: '',
      affectedServices: '',
      allowSupportAccess: true,
      verified: true,
      tags: ['dashboard-support-form'],
      browserInformation: 'Chrome',
      dashboardStudioVersion: mockStudioVersion,
    })
    expect(payload.message).toBe('I need help accessing my Supabase account')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /support request sent/i })).toBeInTheDocument()
    })
  }, 10_000)
})
