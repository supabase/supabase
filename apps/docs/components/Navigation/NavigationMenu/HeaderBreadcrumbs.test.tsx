// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HeaderBreadcrumbs } from './HeaderBreadcrumbs'

vi.mock('next/navigation', () => ({ usePathname: () => '/guides/auth/passwords' }))

describe('HeaderBreadcrumbs', () => {
  afterEach(cleanup)

  it('marks only the crumb of this page as current', () => {
    render(<HeaderBreadcrumbs />)

    const currentCrumbs = screen
      .getByRole('navigation', { name: 'Breadcrumb' })
      .querySelectorAll('[aria-current="page"]')
    expect([...currentCrumbs].map((crumb) => crumb.textContent)).toEqual(['Password-based'])
  })
})
