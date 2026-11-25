import { createMemoryHistory, createRootRoute, createRouter } from '@tanstack/react-router'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HelpOptionsList } from './HelpOptionsList'
import { DOCS_URL } from '@/lib/constants'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'
import { customRender } from '@/tests/lib/custom-render'

const { takeBreadcrumbSnapshotMock } = vi.hoisted(() => ({
  takeBreadcrumbSnapshotMock: vi.fn(),
}))

vi.mock('react-inlinesvg', () => ({
  __esModule: true,
  default: () => null,
}))

vi.mock('@/lib/breadcrumbs', () => ({
  takeBreadcrumbSnapshot: takeBreadcrumbSnapshotMock,
}))

const createTestRouter = (initialUrl = '/') =>
  createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({ initialEntries: [initialUrl] }),
    parseSearch,
    stringifySearch,
  })

describe('HelpOptionsList', () => {
  beforeEach(() => {
    takeBreadcrumbSnapshotMock.mockReset()
    vi.restoreAllMocks()
  })

  it('navigates to support after invoking the click callback by default', async () => {
    const onSupportClick = vi.fn()
    const router = createTestRouter()

    customRender(
      <HelpOptionsList
        isPlatform
        projectRef="project-1"
        supportLinkQueryParams={{ projectRef: 'project-1' }}
        onSupportClick={onSupportClick}
      />,
      { router }
    )

    await userEvent.click(screen.getByRole('button', { name: /contact support/i }))

    expect(onSupportClick).toHaveBeenCalledTimes(1)
    expect(takeBreadcrumbSnapshotMock).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(router.state.location.href).toBe('/support/new?projectRef=project-1')
    })
  })

  it('allows the support callback to suppress navigation', async () => {
    const router = createTestRouter()

    customRender(
      <HelpOptionsList
        isPlatform
        projectRef="project-1"
        supportLinkQueryParams={{ projectRef: 'project-1' }}
        onSupportClick={() => false}
      />,
      { router }
    )

    await userEvent.click(screen.getByRole('button', { name: /contact support/i }))

    expect(takeBreadcrumbSnapshotMock).not.toHaveBeenCalled()
    expect(router.state.location.href).toBe('/')
  })

  it('renders docs as an external link', () => {
    customRender(
      <HelpOptionsList
        isPlatform
        projectRef="project-1"
        supportLinkQueryParams={{ projectRef: 'project-1' }}
      />
    )

    const docsOption = screen.getByRole('link', { name: /docs/i })

    expect(docsOption).toHaveAttribute('href', `${DOCS_URL}/`)
    expect(docsOption).toHaveAttribute('target', '_blank')
    expect(docsOption).toHaveAttribute('rel', 'noreferrer noopener')
  })
})
