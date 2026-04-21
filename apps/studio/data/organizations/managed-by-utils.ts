import { MANAGED_BY, type ManagedBy } from '@/lib/constants/infrastructure'

type OrganizationPartner = string | null | undefined
type OrganizationIntegrationSource = string | null | undefined

export function getManagedByFromOrganizationPartner(
  partner: OrganizationPartner,
  integrationSource?: OrganizationIntegrationSource
): ManagedBy {
  if (partner) {
    switch (partner) {
      case 'vercel_marketplace':
        return MANAGED_BY.VERCEL_MARKETPLACE
      case 'aws_marketplace':
        return MANAGED_BY.AWS_MARKETPLACE
      case 'stripe_projects':
        return MANAGED_BY.STRIPE_PROJECTS
      default:
        return MANAGED_BY.SUPABASE
    }
  }

  switch (integrationSource) {
    case 'stripe_projects':
      return MANAGED_BY.STRIPE_PROJECTS
    default:
      return MANAGED_BY.SUPABASE
  }
}

export function isPartnerBillingOrganization(partner: OrganizationPartner): boolean {
  return Boolean(partner)
}
