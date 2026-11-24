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

  it('keeps the section crumb a link when its overview row has the same url', () => {
    navigation.pathname = '/guides/auth'

    render(<HeaderBreadcrumbs />)

    expect(getCurrentCrumbNames()).toEqual(['Overview'])
  })
})
