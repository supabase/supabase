import { describe, expect, it } from 'vitest'

import PartnerIcon, { getDefaultPartnerTooltipText, getPartnerTooltipText } from './PartnerIcon'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { render } from '@/tests/helpers'
import type { Organization } from '@/types'

describe('PartnerIcon tooltip copy', () => {
  it('returns provider-specific default tooltip copy for AWS, Vercel, and Stripe', () => {
    expect(getDefaultPartnerTooltipText(MANAGED_BY.VERCEL_MARKETPLACE)).toBe(
      'Managed via Vercel Marketplace'
    )
    expect(getDefaultPartnerTooltipText(MANAGED_BY.AWS_MARKETPLACE)).toBe(
      'Billed via AWS Marketplace'
    )
    expect(getDefaultPartnerTooltipText(MANAGED_BY.STRIPE_PROJECTS)).toBe('Connected to Stripe')
  })

  it('uses custom tooltip text when provided', () => {
    expect(
      getPartnerTooltipText({
        managedBy: MANAGED_BY.VERCEL_MARKETPLACE,
        tooltipText: 'Managed by Vercel Marketplace.',
      })
    ).toBe('Managed by Vercel Marketplace.')
  })

  it('falls back to default tooltip text when custom tooltip is not provided', () => {
    expect(
      getPartnerTooltipText({
        managedBy: MANAGED_BY.AWS_MARKETPLACE,
      })
    ).toBe('Billed via AWS Marketplace')
  })

  it('renders an icon element for Stripe organizations', () => {
    const organization = {
      managed_by: MANAGED_BY.STRIPE_PROJECTS,
    } as Pick<Organization, 'managed_by'>

    const { container } = render(
      PartnerIcon({
        organization,
        showTooltip: false,
      })
    )

    expect(container.querySelector('svg')).toBeTruthy()
  })
})
