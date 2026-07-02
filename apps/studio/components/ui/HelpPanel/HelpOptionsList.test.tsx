import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HelpOptionsList } from './HelpOptionsList'
import { DOCS_URL } from '@/lib/constants'
import { customRender } from '@/tests/lib/custom-render'
import { routerMock } from '@/tests/lib/route-mock'

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

describe('HelpOptionsList', () => {
  beforeEach(() => {
    routerMock.setCurrentUrl('/')
    takeBreadcrumbSnapshotMock.mockReset()
    vi.restoreAllMocks()
  })

  it('navigates to support after invoking the click callback by default', async () => {
    const onSupportClick = vi.fn()

    customRender(
      <HelpOptionsList
        isPlatform
        projectRef="project-1"
        supportLinkQueryParams={{ projectRef: 'project-1' }}
        onSupportClick={onSupportClick}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: /contact support/i }))

    expect(onSupportClick).toHaveBeenCalledTimes(1)
    expect(takeBreadcrumbSnapshotMock).toHaveBeenCalledTimes(1)
    expect(routerMock.asPath).toBe('/support/new?projectRef=project-1')
  })

  it('allows the support callback to suppress navigation', async () => {
    customRender(
      <HelpOptionsList
        isPlatform
        projectRef="project-1"
        supportLinkQueryParams={{ projectRef: 'project-1' }}
        onSupportClick={() => false}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: /contact support/i }))

    expect(takeBreadcrumbSnapshotMock).not.toHaveBeenCalled()
    expect(routerMock.asPath).toBe('/')
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
