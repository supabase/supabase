// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HeaderBreadcrumbs } from './HeaderBreadcrumbs'

const navigation = vi.hoisted(() => ({ pathname: '/guides/auth/passwords' }))

vi.mock('next/navigation', () => ({ usePathname: () => navigation.pathname }))

// the variant hook loads browser-only modules
vi.mock('~/features/IaNav/useIaNavVariant', () => ({ useIaNavVariant: () => 'control' }))

const getCurrentCrumbNames = () =>
  [
    ...screen
      .getByRole('navigation', { name: 'Breadcrumb' })
      .querySelectorAll('[aria-current="page"]'),
  ].map((crumb) => crumb.textContent)

describe('HeaderBreadcrumbs', () => {
  afterEach(cleanup)

  it('marks only the crumb of this page as current', () => {
    navigation.pathname = '/guides/auth/passwords'

    render(<HeaderBreadcrumbs />)

    expect(getCurrentCrumbNames()).toEqual(['Password-based'])
  })

  it('links a group crumb to its overview page', () => {
    navigation.pathname = '/guides/database/replication/pipelines'

    render(<HeaderBreadcrumbs />)

    const groupLink = screen.getByRole('link', { name: 'Database replication' })
    expect(groupLink.getAttribute('href')).toBe('/guides/database/replication')
    expect(getCurrentCrumbNames()).toEqual(['Pipelines'])
  })

  it('shows the group as the current crumb on its overview page', () => {
    navigation.pathname = '/guides/database/replication'

    render(<HeaderBreadcrumbs />)

    expect(getCurrentCrumbNames()).toEqual(['Database replication'])
    expect(screen.queryByText('Overview')).toBeNull()
  })
})
