import type { PlanId } from './plans'

export type PricingCalculatorCurrency = 'USD'

export type UsageDimensionKey =
  | 'projects'
  | 'compute'
  | 'database_size_gb'
  | 'storage_size_gb'
  | 'egress_gb'
  | 'mau'
  | 'sso_mau'
  | 'realtime_peak_connections'
  | 'realtime_messages'
  | 'edge_invocations'
  | 'phone_mfa'

export type PricingCalculatorPlan = Exclude<PlanId, 'enterprise'>

export type SupabasePricingModel = {
  version: string
  currency: PricingCalculatorCurrency
  plans: Record<
    PricingCalculatorPlan,
    {
      subscriptionMonthlyUsd: number
      included: {
        // Quotas / allowances
        databaseSizeGbPerProject: number
        storageSizeGbPerOrg: number
        egressGbPerOrg: number
        mauPerOrg: number
        // Auth SAML 2.0 (end-user SSO)
        ssoMauPerOrg: number
        realtimePeakConnectionsPerOrg: number
        realtimeMessagesPerOrg: number
        edgeInvocationsPerOrg: number
        // Free plan project allowance (projects are a “limit”, not an overage line item)
        activeProjectsLimit?: number
      }
      overage: {
        databaseSizeUsdPerGb: number
        storageSizeUsdPerGb: number
        egressUsdPerGb: number
        mauUsdPerMau: number
        ssoMauUsdPerMau: number
        realtimePeakConnectionsUsdPer1000: number
        realtimeMessagesUsdPerMillion: number
        edgeInvocationsUsdPerMillion: number
      }
      availability: {
        sso: boolean
      }
    }
  >
  credits: {
    computeCreditsMonthlyUsd: number
    appliesToPlans: PricingCalculatorPlan[]
  }
  addons: {
    // Advanced Multi-Factor Auth - Phone
    phoneMfa: {
      monthlyUsdFirstProject: number
      monthlyUsdPerAdditionalProject: number
      appliesToPlans: PricingCalculatorPlan[]
    }
  }
}

/**
 * Versioned pricing snapshot for the pricing calculator.
 *
 * Sources:
 * - `apps/docs/content/guides/platform/billing-on-supabase.mdx` (quotas + overage rates)
 * - `apps/docs/content/guides/platform/billing-faq.mdx` (compute credits)
 * - `packages/shared-data/plans.ts` (subscription plan fees)
 * - `packages/shared-data/pricing.ts` (phone MFA add-on pricing)
 */
export const pricingCalculatorVersion = 'v1'

export const supabasePricingModel: SupabasePricingModel = {
  version: pricingCalculatorVersion,
  currency: 'USD',
  plans: {
    free: {
      subscriptionMonthlyUsd: 0,
      included: {
        activeProjectsLimit: 2,
        databaseSizeGbPerProject: 0.5,
        storageSizeGbPerOrg: 1,
        egressGbPerOrg: 5,
        mauPerOrg: 50_000,
        ssoMauPerOrg: 0,
        realtimePeakConnectionsPerOrg: 200,
        realtimeMessagesPerOrg: 2_000_000,
        edgeInvocationsPerOrg: 500_000,
      },
      overage: {
        // Free plan overages are blocked/restricted; we still keep numeric values as 0.
        databaseSizeUsdPerGb: 0,
        storageSizeUsdPerGb: 0,
        egressUsdPerGb: 0,
        mauUsdPerMau: 0,
        ssoMauUsdPerMau: 0,
        realtimePeakConnectionsUsdPer1000: 0,
        realtimeMessagesUsdPerMillion: 0,
        edgeInvocationsUsdPerMillion: 0,
      },
      availability: {
        sso: false,
      },
    },
    pro: {
      subscriptionMonthlyUsd: 25,
      included: {
        databaseSizeGbPerProject: 8,
        storageSizeGbPerOrg: 100,
        egressGbPerOrg: 250,
        mauPerOrg: 100_000,
        ssoMauPerOrg: 50,
        realtimePeakConnectionsPerOrg: 500,
        realtimeMessagesPerOrg: 5_000_000,
        edgeInvocationsPerOrg: 2_000_000,
      },
      overage: {
        databaseSizeUsdPerGb: 0.125,
        storageSizeUsdPerGb: 0.021,
        egressUsdPerGb: 0.09,
        mauUsdPerMau: 0.00325,
        ssoMauUsdPerMau: 0.015,
        realtimePeakConnectionsUsdPer1000: 10,
        realtimeMessagesUsdPerMillion: 2.5,
        edgeInvocationsUsdPerMillion: 2,
      },
      availability: {
        sso: true,
      },
    },
    team: {
      subscriptionMonthlyUsd: 599,
      included: {
        databaseSizeGbPerProject: 8,
        storageSizeGbPerOrg: 100,
        egressGbPerOrg: 250,
        mauPerOrg: 100_000,
        ssoMauPerOrg: 50,
        realtimePeakConnectionsPerOrg: 500,
        realtimeMessagesPerOrg: 5_000_000,
        edgeInvocationsPerOrg: 2_000_000,
      },
      overage: {
        databaseSizeUsdPerGb: 0.125,
        storageSizeUsdPerGb: 0.021,
        egressUsdPerGb: 0.09,
        mauUsdPerMau: 0.00325,
        ssoMauUsdPerMau: 0.015,
        realtimePeakConnectionsUsdPer1000: 10,
        realtimeMessagesUsdPerMillion: 2.5,
        edgeInvocationsUsdPerMillion: 2,
      },
      availability: {
        sso: true,
      },
    },
  },
  credits: {
    computeCreditsMonthlyUsd: 10,
    appliesToPlans: ['pro', 'team'],
  },
  addons: {
    phoneMfa: {
      monthlyUsdFirstProject: 75,
      monthlyUsdPerAdditionalProject: 10,
      appliesToPlans: ['pro', 'team'],
    },
  },
}
