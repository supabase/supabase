import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { RESTRICTION_MESSAGES } from './restriction.constants'
import { customRender } from '@/tests/lib/custom-render'

const { description } = RESTRICTION_MESSAGES.OVERDUE_INVOICES_FROM_OTHER_ORGS

const stevens = { name: "Steven's Org", slug: 'stevens-org' }
const acme = { name: 'Acme', slug: 'acme' }
const globex = { name: 'Globex', slug: 'globex' }

describe('OVERDUE_INVOICES_FROM_OTHER_ORGS description', () => {
  test('names the organization and links to its invoices', () => {
    customRender(<p data-testid="message">{description([stevens])}</p>)

    expect(screen.getByRole('link', { name: "Steven's Org" })).toHaveAttribute(
      'href',
      '/org/stevens-org/billing#invoices'
    )
    expect(screen.getByTestId('message')).toHaveTextContent(
      "Pay invoices for Steven's Org to avoid service disruption"
    )
  })

  test('names only the first organization and counts the rest', () => {
    customRender(<p data-testid="message">{description([acme, stevens])}</p>)
    expect(screen.getByTestId('message')).toHaveTextContent(
      'Pay invoices for Acme and 1 other to avoid service disruption'
    )
    expect(screen.queryByRole('link', { name: "Steven's Org" })).not.toBeInTheDocument()
  })

  test('pluralizes the remaining count', () => {
    customRender(<p data-testid="message">{description([acme, stevens, globex])}</p>)
    expect(screen.getByTestId('message')).toHaveTextContent(
      'Pay invoices for Acme and 2 others to avoid service disruption'
    )
  })

  test('falls back to the organizations list when none can be resolved', () => {
    customRender(<p data-testid="message">{description([])}</p>)
    expect(screen.getByRole('link', { name: 'Pay outstanding invoices' })).toHaveAttribute(
      'href',
      '/organizations'
    )
    expect(screen.getByTestId('message')).toHaveTextContent(
      'Pay outstanding invoices to avoid service disruption'
    )
  })
})
