import { STRIPE_PRODUCT_IDS } from 'lib/constants'

/**
 * @mildtomato same plan metadata is also in /www website
 * would be good if this constant was shared across apps
 *
 * https://github.com/supabase/supabase/blob/master/studio/components/interfaces/Billing/PlanSelection/Plans/Plans.Constants.ts
 */
export const PRICING_META = {
  [STRIPE_PRODUCT_IDS.FREE]: {
    name: 'Free',
    description: 'Perfect for passion projects & simple websites.',
    priceMonthly: 0,
    priceUnit: 'per month per project',
    warning: 'Limit of 2 free projects',
    preface: 'Get started with:',
    features: [
      'Up to 500MB database & 1GB file storage',
      'Up to 2GB bandwidth',
      'Up to 50MB file uploads',
      'Social OAuth providers',
      '50,000 monthly active users',
      'Up to 500K Edge Function invocations',
      '1-day log retention',
      '200 concurrent Realtime connections',
      '2 million Realtime messages',
      'Community support',
    ],
    scale: 'Free projects are paused after 1 week of inactivity.',
  },
  [STRIPE_PRODUCT_IDS.PRO]: {
    name: 'Pro',
    description: 'For production applications with the option to scale.',
    priceMonthly: 25,
    priceUnit: 'per month per project',
    warning: '+ any additional usage',
    preface: 'Everything in the Free plan, plus:',
    features: [
      '8GB database & 100GB file storage',
      '50GB bandwidth',
      '5GB file uploads',
      'Social OAuth providers',
      '100,000 monthly active users',
      '2M Edge Function invocations',
      'Daily backups',
      '7-day log retention',
      '500 concurrent Realtime connections',
      '5 million Realtime messages',
      'No project pausing',
      'Email support',
    ],
    additional: 'Need more? Turn off your spend cap to Pay As You Grow ',
    scale: 'Additional fees apply for usage and storage beyond the limits above.',
  },
  [STRIPE_PRODUCT_IDS.TEAM]: {
    new: true,
    name: 'Team',
    description: 'Collaborate with different permissions and access patterns.',
    priceMonthly: 599,
    priceUnit: 'per month per organization',
    warning: '+ usage',
    preface: 'The following features will apply to all projects within the organization:',
    features: [
      'Usage-based pricing',
      '100,000 monthly active users included',
      'Organization member roles (ABAC)',
      'Standardised Security Questionnaire',
      'SOC2',
      'SSO for Supabase Dashboard',
      'Priority email support & SLAs',
      '1 XS compute instance',
      '14 day backups',
      '28 day log retention',
    ],
  },
  Enterprise: {
    name: 'Enterprise',
    href: '/contact/enterprise',
    description: 'For large-scale applications managing serious workloads.',
    features: [
      `Point in time recovery`,
      `Designated Support manager & SLAs`,
      `Enterprise OAuth providers`,
      `SSO/ SAML`,
      `SOC2`,
      `Custom contracts & invoicing`,
      `On-premise support`,
      `24×7×365 premium enterprise support`,
    ],
  },
}
