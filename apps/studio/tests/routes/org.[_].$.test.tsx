import { screen } from '@testing-library/react'
import type { components } from 'api-types'
import { describe, expect, it } from 'vitest'

import { Route as OrgWildcardRoute } from '@/routes/org.[_]'
import { Route as OrgWildcardSplatRoute } from '@/routes/org.[_].$'
import { addAPIMock } from '@/tests/lib/msw'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { renderRoute } from '@/tests/lib/route-render'

type OrganizationResponse = components['schemas']['OrganizationResponse_Output']

const organization = {
  id: 1,
  slug: 'acme',
  name: 'Acme',
  plan: { id: 'free', name: 'Free' },
} as OrganizationResponse

describe('/org/_', () => {
  it('links each organization to the requested sub-page, keeping the query string', async () => {
    addAPIMock({ method: 'get', path: '/platform/organizations', response: [organization] })

    await renderRoute(OrgWildcardSplatRoute, {
      routeId: '/org/_/$',
      url: '/org/_/billing/invoices?panel=open&tab=a&tab=b',
      profileContext: createMockProfileContext(),
    })

    const link = await screen.findByRole('link', { name: /Acme/ })
    expect(link).toHaveAttribute('href', '/org/acme/billing/invoices?panel=open&tab=a&tab=b')
  })

  it('links to the organization home without a trailing path', async () => {
    addAPIMock({ method: 'get', path: '/platform/organizations', response: [organization] })

    await renderRoute(OrgWildcardRoute, {
      routeId: '/org/_',
      url: '/org/_',
      profileContext: createMockProfileContext(),
    })

    const link = await screen.findByRole('link', { name: /Acme/ })
    expect(link).toHaveAttribute('href', '/org/acme')
  })
})
