import { waitFor } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test, vi } from 'vitest'

import { useOrganizationRestrictions } from './useOrganizationRestrictions'
import { RESTRICTION_MESSAGES } from '@/components/interfaces/Organization/restriction.constants'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'

type OrganizationResponse = components['schemas']['OrganizationResponse_Output']
type OverdueInvoiceCount = components['schemas']['OverdueInvoiceCount_Output']

vi.mock(import('common'), async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useParams: () => ({ slug: 'mine' }), useIsLoggedIn: () => true }
})

vi.mock(import('@/lib/constants'), async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, IS_PLATFORM: true }
})

const ORGANIZATIONS = [
  createMockOrganizationResponse({ id: 1, name: 'Mine', slug: 'mine' }),
  createMockOrganizationResponse({ id: 2, name: 'Zeta', slug: 'zeta' }),
  createMockOrganizationResponse({ id: 3, name: 'Acme', slug: 'acme' }),
]

const mockEndpoints = (overdueInvoices: OverdueInvoiceCount[]) => {
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: () => HttpResponse.json<OrganizationResponse[]>(ORGANIZATIONS),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/stripe/invoices/overdue',
    response: () => HttpResponse.json<OverdueInvoiceCount[]>(overdueInvoices),
  })
}

const renderWarnings = async (overdueInvoices: OverdueInvoiceCount[]) => {
  mockEndpoints(overdueInvoices)
  const { result } = customRenderHook(() => useOrganizationRestrictions(), {
    profileContext: createMockProfileContext(),
  })
  // Wait for both queries: the selected org and the overdue invoices
  await waitFor(() => expect(result.current.org?.slug).toBe('mine'))
  return result
}

const otherOrgsWarningMarkup = (result: {
  current: ReturnType<typeof useOrganizationRestrictions>
}) => {
  const warning = result.current.warnings.find(
    (w) => w.title === RESTRICTION_MESSAGES.OVERDUE_INVOICES_FROM_OTHER_ORGS.title
  )
  return warning ? renderToStaticMarkup(<>{warning.description}</>) : undefined
}

describe('useOrganizationRestrictions: overdue invoices in other organizations', () => {
  test('names the other organization with overdue invoices', async () => {
    const result = await renderWarnings([{ organization_id: 2, overdue_invoice_count: 1 }])

    await waitFor(() => expect(otherOrgsWarningMarkup(result)).toContain('Zeta'))
    expect(otherOrgsWarningMarkup(result)).toContain('href="/org/zeta/billing#invoices"')
    expect(otherOrgsWarningMarkup(result)).not.toContain('other')
  })

  test('names the first organization alphabetically and counts the rest', async () => {
    const result = await renderWarnings([
      { organization_id: 2, overdue_invoice_count: 1 },
      { organization_id: 3, overdue_invoice_count: 1 },
    ])

    await waitFor(() => expect(otherOrgsWarningMarkup(result)).toContain('Acme'))
    expect(otherOrgsWarningMarkup(result)).toContain('and 1 other')
    expect(otherOrgsWarningMarkup(result)).not.toContain('Zeta')
  })

  test('counts an organization once however many invoices it has overdue', async () => {
    const result = await renderWarnings([
      { organization_id: 3, overdue_invoice_count: 4 },
      { organization_id: 3, overdue_invoice_count: 1 },
    ])

    await waitFor(() => expect(otherOrgsWarningMarkup(result)).toContain('Acme'))
    expect(otherOrgsWarningMarkup(result)).not.toContain('other')
  })

  test('does not list the current organization as an other organization', async () => {
    const result = await renderWarnings([
      { organization_id: 1, overdue_invoice_count: 1 },
      { organization_id: 2, overdue_invoice_count: 1 },
    ])

    await waitFor(() => expect(otherOrgsWarningMarkup(result)).toContain('Zeta'))
    expect(otherOrgsWarningMarkup(result)).not.toContain('Mine')
    expect(otherOrgsWarningMarkup(result)).not.toContain('other')
    // The current organization's own overdue invoices get their own banner
    expect(result.current.warnings.map((w) => w.title)).toContain(
      RESTRICTION_MESSAGES.OVERDUE_INVOICES.title
    )
  })

  test('shows no other-organizations banner when only the current organization is overdue', async () => {
    const result = await renderWarnings([{ organization_id: 1, overdue_invoice_count: 1 }])

    await waitFor(() =>
      expect(result.current.warnings.map((w) => w.title)).toContain(
        RESTRICTION_MESSAGES.OVERDUE_INVOICES.title
      )
    )
    expect(otherOrgsWarningMarkup(result)).toBeUndefined()
  })
})
