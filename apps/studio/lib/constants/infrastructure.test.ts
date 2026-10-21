import { describe, expect, it } from 'vitest'

import { MANAGED_BY, type ManagedBy } from './infrastructure'

describe('constants/infrastructure', () => {
  describe('MANAGED_BY', () => {
    it('should expose the partner identifiers used by the platform API', () => {
      expect(MANAGED_BY).toEqual({
        VERCEL_MARKETPLACE: 'vercel-marketplace',
        AWS_MARKETPLACE: 'aws-marketplace',
        STRIPE_PROJECTS: 'stripe-projects',
        SUPABASE: 'supabase',
      })
    })

    it('should type each value as a string literal rather than string', () => {
      // These annotations stop compiling if the `as const` assertion is dropped,
      // which is what silently widens `ManagedBy` to `string`.
      const vercelMarketplace: 'vercel-marketplace' = MANAGED_BY.VERCEL_MARKETPLACE
      const awsMarketplace: 'aws-marketplace' = MANAGED_BY.AWS_MARKETPLACE
      const stripeProjects: 'stripe-projects' = MANAGED_BY.STRIPE_PROJECTS
      const supabase: 'supabase' = MANAGED_BY.SUPABASE

      expect([vercelMarketplace, awsMarketplace, stripeProjects, supabase]).toEqual(
        Object.values(MANAGED_BY)
      )
    })

    it('should derive ManagedBy as the union of those literals', () => {
      // Fails to compile if a partner is added to MANAGED_BY without being
      // handled here, and documents the union `ManagedBy` resolves to.
      const partnerNames: Record<ManagedBy, string> = {
        'vercel-marketplace': 'Vercel Marketplace',
        'aws-marketplace': 'AWS Marketplace',
        'stripe-projects': 'Stripe Projects',
        supabase: 'Supabase',
      }

      expect(Object.keys(partnerNames).sort()).toEqual([...Object.values(MANAGED_BY)].sort())
    })
  })
})
