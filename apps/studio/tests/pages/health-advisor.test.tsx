import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ProjectHealthLints from '@/pages/project/[ref]/advisors/health'

const mocks = vi.hoisted(() => ({
  flags: { hasLoaded: false, enabled: false },
  router: { replace: vi.fn() },
  query: vi.fn(),
  shortcuts: vi.fn(),
}))

vi.mock('common', () => ({
  useFeatureFlags: () => ({ hasLoaded: mocks.flags.hasLoaded }),
  useFlag: () => mocks.flags.enabled,
  useParams: () => ({ ref: 'test-project' }),
}))
vi.mock('next/router', () => ({ useRouter: () => mocks.router }))
vi.mock('@/lib/constants', () => ({ IS_PLATFORM: true }))
vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({ data: { ref: 'test-project' } }),
}))
vi.mock('@/data/lint/health-lints-query', () => ({
  useProjectHealthLintsQuery: mocks.query,
}))
vi.mock('@/components/interfaces/Linter/useAdvisorPageShortcuts', () => ({
  useAdvisorPageShortcuts: mocks.shortcuts,
}))
vi.mock('@/components/interfaces/Linter/Linter.utils', () => ({
  lintInfoMap: [],
  parseLinterLevel: () => undefined,
}))
vi.mock('@/components/interfaces/Linter/LinterDataGrid', () => ({
  LinterDataGrid: () => null,
}))
vi.mock('@/components/interfaces/Linter/LinterFilters', () => ({ default: () => null }))
vi.mock('@/components/interfaces/Linter/LintPageTabs', () => ({ default: () => null }))
vi.mock('@/components/layouts/AdvisorsLayout/AdvisorsLayout', () => ({ default: () => null }))
vi.mock('@/components/layouts/DefaultLayout', () => ({ DefaultLayout: () => null }))
vi.mock('@/components/ui/Forms/FormHeader', () => ({
  FormHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}))
vi.mock('ui', () => ({ LoadingLine: () => null }))

describe('Health Advisor feature flag', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.flags.hasLoaded = false
    mocks.flags.enabled = false
    mocks.query.mockReturnValue({
      data: [],
      isPending: false,
      isRefetching: false,
      refetch: vi.fn(),
    })
  })

  it('renders after the flag loads without changing hook order', () => {
    const { rerender } = render(<ProjectHealthLints />)

    expect(screen.queryByRole('heading', { name: 'Health Advisor' })).not.toBeInTheDocument()
    expect(mocks.router.replace).not.toHaveBeenCalled()
    expect(mocks.query).not.toHaveBeenCalled()
    expect(mocks.shortcuts).not.toHaveBeenCalled()

    mocks.flags.hasLoaded = true
    mocks.flags.enabled = true
    rerender(<ProjectHealthLints />)

    expect(screen.getByRole('heading', { name: 'Health Advisor' })).toBeInTheDocument()
    expect(mocks.query).toHaveBeenCalled()
    expect(mocks.shortcuts).toHaveBeenCalled()
    expect(mocks.router.replace).not.toHaveBeenCalled()

    mocks.flags.enabled = false
    rerender(<ProjectHealthLints />)

    expect(screen.queryByRole('heading', { name: 'Health Advisor' })).not.toBeInTheDocument()
    expect(mocks.router.replace).toHaveBeenCalledWith('/project/test-project/advisors/security')
  })

  it('redirects when the loaded flag is disabled without mounting health functionality', () => {
    mocks.flags.hasLoaded = true
    render(<ProjectHealthLints />)

    expect(mocks.router.replace).toHaveBeenCalledWith('/project/test-project/advisors/security')
    expect(mocks.query).not.toHaveBeenCalled()
    expect(mocks.shortcuts).not.toHaveBeenCalled()
  })
})
