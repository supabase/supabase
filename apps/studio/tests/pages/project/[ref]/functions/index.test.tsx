import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import EdgeFunctionsPage from '@/pages/project/[ref]/functions/index'
import { customRender as render } from '@/tests/lib/custom-render'

const {
  mockUseDeploymentMode,
  mockUseEdgeFunctionsQuery,
  mockUseIsProjectActive,
  mockUseFunctionsListShortcuts,
  mockUseFlag,
} = vi.hoisted(() => ({
  mockUseDeploymentMode: vi.fn(),
  mockUseEdgeFunctionsQuery: vi.fn(),
  mockUseIsProjectActive: vi.fn(),
  mockUseFunctionsListShortcuts: vi.fn(),
  mockUseFlag: vi.fn(),
}))

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return {
    ...actual,
    useFlag: mockUseFlag,
    useParams: () => ({ ref: 'default' }),
  }
})

vi.mock('@/hooks/misc/useDeploymentMode', () => ({
  useDeploymentMode: mockUseDeploymentMode,
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useIsProjectActive: mockUseIsProjectActive,
}))

vi.mock('@/data/edge-functions/edge-functions-query', () => ({
  useEdgeFunctionsQuery: mockUseEdgeFunctionsQuery,
}))

vi.mock('@/components/interfaces/Functions/useFunctionsListShortcuts', () => ({
  useFunctionsListShortcuts: mockUseFunctionsListShortcuts,
}))

vi.mock('@/components/layouts/DefaultLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/layouts/EdgeFunctionsLayout/EdgeFunctionsLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/interfaces/Functions/EdgeFunctionsListItem', () => ({
  EdgeFunctionsListItem: ({ function: fn }: { function: { name: string } }) => (
    <tr>
      <td>list-item:{fn.name}</td>
    </tr>
  ),
}))

vi.mock('@/components/interfaces/Functions/FunctionsEmptyState', () => ({
  FunctionsEmptyState: () => <div>FunctionsEmptyState</div>,
  SelfHostedManualFunctionCard: () => <div>SelfHostedManualFunctionCard</div>,
}))

vi.mock('@/components/interfaces/Functions/TerminalInstructionsDialog', () => ({
  TerminalInstructionsDialog: () => null,
}))

vi.mock('@/components/interfaces/EdgeFunctions/EdgeFunctionsSortDropdown', async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    '@/components/interfaces/EdgeFunctions/EdgeFunctionsSortDropdown'
  )
  return {
    ...actual,
    EdgeFunctionsSortDropdown: () => <div>SortDropdown</div>,
  }
})

const fn = (name: string) => ({
  id: name,
  name,
  slug: name,
  created_at: 0,
  updated_at: 0,
})

describe('/project/[ref]/functions', () => {
  beforeEach(() => {
    mockUseFlag.mockReturnValue(false)
    mockUseIsProjectActive.mockReturnValue(true)
    mockUseFunctionsListShortcuts.mockReturnValue(undefined)
    mockUseDeploymentMode.mockReturnValue({
      isPlatform: false,
      isCli: false,
      isSelfHosted: true,
    })
  })

  it('renders the empty state when there are zero functions on self-hosted', () => {
    mockUseEdgeFunctionsQuery.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      isSuccess: true,
      isFetching: false,
      refetch: vi.fn(),
    })

    render(<EdgeFunctionsPage dehydratedState={{}} />)

    expect(screen.getByText('FunctionsEmptyState')).toBeInTheDocument()
    expect(screen.queryByText('SelfHostedManualFunctionCard')).not.toBeInTheDocument()
  })

  it('renders SelfHostedManualFunctionCard when isSelfHosted and exactly one function exists', () => {
    mockUseEdgeFunctionsQuery.mockReturnValue({
      data: [fn('hello')],
      isPending: false,
      isError: false,
      isSuccess: true,
      isFetching: false,
      refetch: vi.fn(),
    })

    render(<EdgeFunctionsPage dehydratedState={{}} />)

    expect(screen.getByText('SelfHostedManualFunctionCard')).toBeInTheDocument()
    expect(screen.getByText('list-item:hello')).toBeInTheDocument()
  })

  it('hides SelfHostedManualFunctionCard when more than one function exists', () => {
    mockUseEdgeFunctionsQuery.mockReturnValue({
      data: [fn('hello'), fn('world')],
      isPending: false,
      isError: false,
      isSuccess: true,
      isFetching: false,
      refetch: vi.fn(),
    })

    render(<EdgeFunctionsPage dehydratedState={{}} />)

    expect(screen.queryByText('SelfHostedManualFunctionCard')).not.toBeInTheDocument()
    expect(screen.getByText('list-item:hello')).toBeInTheDocument()
    expect(screen.getByText('list-item:world')).toBeInTheDocument()
  })

  it('hides SelfHostedManualFunctionCard on platform even with one function', () => {
    mockUseDeploymentMode.mockReturnValue({
      isPlatform: true,
      isCli: false,
      isSelfHosted: false,
    })
    mockUseEdgeFunctionsQuery.mockReturnValue({
      data: [fn('hello')],
      isPending: false,
      isError: false,
      isSuccess: true,
      isFetching: false,
      refetch: vi.fn(),
    })

    render(<EdgeFunctionsPage dehydratedState={{}} />)

    expect(screen.queryByText('SelfHostedManualFunctionCard')).not.toBeInTheDocument()
  })
})
