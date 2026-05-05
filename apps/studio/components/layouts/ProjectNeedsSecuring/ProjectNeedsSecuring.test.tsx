import { fireEvent, screen } from '@testing-library/react'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import type { MouseEventHandler, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectNeedsSecuring } from './ProjectNeedsSecuring'
import { render } from '@/tests/helpers'

const {
  mockUseFlag,
  mockUseProjectLintsQuery,
  mockUseSelectedProjectQuery,
  mockUseTablesQuery,
  mockUseProjectPostgrestConfigQuery,
  mockUseTablePrivilegesQuery,
  mockUseLocalStorageQuery,
  mockUseRouter,
  mockRouterPush,
} = vi.hoisted(() => ({
  mockUseFlag: vi.fn(),
  mockUseProjectLintsQuery: vi.fn(),
  mockUseSelectedProjectQuery: vi.fn(),
  mockUseTablesQuery: vi.fn(),
  mockUseProjectPostgrestConfigQuery: vi.fn(),
  mockUseTablePrivilegesQuery: vi.fn(),
  mockUseLocalStorageQuery: vi.fn(),
  mockUseRouter: vi.fn(),
  mockRouterPush: vi.fn(),
}))

vi.mock('common', async () => {
  const actual = await vi.importActual<typeof import('common')>('common')

  return {
    ...actual,
    useFlag: mockUseFlag,
    useParams: () => ({ ref: 'project-ref' }),
  }
})

vi.mock('next/router', () => ({
  useRouter: () => mockUseRouter(),
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    onClick,
    ...props
  }: {
    href: string
    children: ReactNode
    onClick?: MouseEventHandler<HTMLAnchorElement>
    [key: string]: unknown
  }) => (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/data/lint/lint-query', () => ({
  useProjectLintsQuery: mockUseProjectLintsQuery,
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: mockUseSelectedProjectQuery,
}))

vi.mock('@/data/tables/tables-query', () => ({
  useTablesQuery: mockUseTablesQuery,
}))

vi.mock('@/data/config/project-postgrest-config-query', () => ({
  parseDbSchemaString: vi.fn((value: string) => value.split(',').map((schema) => schema.trim())),
  useProjectPostgrestConfigQuery: mockUseProjectPostgrestConfigQuery,
}))

vi.mock('@/data/privileges/table-privileges-query', () => ({
  useTablePrivilegesQuery: mockUseTablePrivilegesQuery,
}))

vi.mock('@/hooks/misc/useLocalStorage', () => ({
  useLocalStorageQuery: mockUseLocalStorageQuery,
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

const issueLint = {
  cache_key: 'lint-1',
  name: 'rls_disabled_in_public',
  detail: 'RLS is disabled on public.invoices',
  description: 'RLS disabled',
  level: 'ERROR',
  categories: ['SECURITY'],
  metadata: {
    schema: 'public',
    name: 'invoices',
  },
}

const tables = [
  {
    id: 1,
    name: 'invoices',
    schema: 'public',
    rls_enabled: false,
  },
  {
    id: 2,
    name: 'profiles',
    schema: 'public',
    rls_enabled: false,
  },
  {
    id: 3,
    name: 'customers',
    schema: 'public',
    rls_enabled: true,
  },
]

const tablePrivileges = [
  {
    schema: 'public',
    name: 'invoices',
    privileges: [
      {
        grantee: 'anon',
        privilege_type: 'SELECT',
      },
    ],
  },
]

describe('ProjectNeedsSecuring', () => {
  beforeEach(() => {
    mockAnimationsApi()
    mockUseFlag.mockReturnValue(true)
    mockUseRouter.mockReturnValue({ pathname: '/project/[ref]', push: mockRouterPush })
    mockUseSelectedProjectQuery.mockReturnValue({
      data: { connectionString: 'postgresql://example' },
    })
    mockUseProjectLintsQuery.mockReturnValue({
      data: [issueLint],
      isPending: false,
      isError: false,
    })
    mockUseTablesQuery.mockReturnValue({
      data: tables,
      isPending: false,
      isError: false,
    })
    mockUseProjectPostgrestConfigQuery.mockReturnValue({
      data: 'public',
      isPending: false,
      isError: false,
    })
    mockUseTablePrivilegesQuery.mockReturnValue({
      data: tablePrivileges,
      isPending: false,
      isError: false,
    })
    mockUseLocalStorageQuery.mockReturnValue([null, vi.fn(), { isLoading: false }])
  })

  afterEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  it('renders the security gate when an exposed table has RLS disabled and the project has not been dismissed', () => {
    render(
      <ProjectNeedsSecuring>
        <div data-testid="project-children">Project content</div>
      </ProjectNeedsSecuring>
    )

    expect(screen.getByText('Your project needs securing')).toBeInTheDocument()
    expect(screen.getByText('Review and fix')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Data API settings' })).toHaveAttribute(
      'href',
      '/project/project-ref/integrations/data_api/settings'
    )
    expect(screen.queryByRole('columnheader', { name: 'Action' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'View policies' })).not.toBeInTheDocument()
    expect(screen.queryByText('profiles')).not.toBeInTheDocument()
    expect(screen.queryByText('customers')).not.toBeInTheDocument()
    expect(screen.getByText('Skip to home')).toBeInTheDocument()
    expect(screen.queryByTestId('project-children')).not.toBeInTheDocument()
  })

  it('navigates to the table policies page when a table row is clicked', () => {
    render(
      <ProjectNeedsSecuring>
        <div data-testid="project-children">Project content</div>
      </ProjectNeedsSecuring>
    )

    fireEvent.click(screen.getByText('invoices'))

    expect(mockRouterPush).toHaveBeenCalledWith(
      '/project/project-ref/auth/policies?schema=public&search=invoices'
    )
  })

  it('renders the project content when the security gate has been dismissed', () => {
    mockUseLocalStorageQuery.mockReturnValue([
      '2026-04-21T00:00:00.000Z',
      vi.fn(),
      { isLoading: false },
    ])

    render(
      <ProjectNeedsSecuring>
        <div data-testid="project-children">Project content</div>
      </ProjectNeedsSecuring>
    )

    expect(screen.queryByText('Your project needs securing')).not.toBeInTheDocument()
    expect(screen.getByTestId('project-children')).toBeInTheDocument()
  })

  it('renders the project content when there are no RLS issues', () => {
    mockUseProjectLintsQuery.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    })

    render(
      <ProjectNeedsSecuring>
        <div data-testid="project-children">Project content</div>
      </ProjectNeedsSecuring>
    )

    expect(screen.queryByText('Your project needs securing')).not.toBeInTheDocument()
    expect(screen.getByTestId('project-children')).toBeInTheDocument()
  })

  it('renders the project content on non-home project routes', () => {
    mockUseRouter.mockReturnValue({ pathname: '/project/[ref]/database/tables' })

    render(
      <ProjectNeedsSecuring>
        <div data-testid="project-children">Project content</div>
      </ProjectNeedsSecuring>
    )

    expect(screen.queryByText('Your project needs securing')).not.toBeInTheDocument()
    expect(screen.getByTestId('project-children')).toBeInTheDocument()
  })

  it('renders the project content when the feature flag is disabled', () => {
    mockUseFlag.mockReturnValue(false)

    render(
      <ProjectNeedsSecuring>
        <div data-testid="project-children">Project content</div>
      </ProjectNeedsSecuring>
    )

    expect(screen.queryByText('Your project needs securing')).not.toBeInTheDocument()
    expect(screen.getByTestId('project-children')).toBeInTheDocument()
  })
})
