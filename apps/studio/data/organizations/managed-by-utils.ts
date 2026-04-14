import { MANAGED_BY, type ManagedBy } from '@/lib/constants/infrastructure'

type OrganizationPartner = string | null | undefined

// The API currently exposes partner state via `billing_partner`, even for connected
// partner experiences that do not fully own billing.
export function getManagedByFromOrganizationPartner(partner: OrganizationPartner): ManagedBy {
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
