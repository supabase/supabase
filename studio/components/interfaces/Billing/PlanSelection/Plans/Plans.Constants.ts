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
    href: '#',
    priceMonthly: 0,
    warning: 'Limit of 2 free projects',
    description: 'Perfect for passion projects & simple websites.',
    features: [
      'Up to 500MB database & 1GB file storage',
      'Up to 2GB bandwidth',
      'Up to 50MB file uploads',
      'Social OAuth providers',
      'Up to 500K Edge Function invocations',
      '1-day log retention',
      'Community support',
    ],
    additional: 'Free projects are paused after 1 week of inactivity.',

    cta: 'Get Started',
  },
  [STRIPE_PRODUCT_IDS.PRO]: {
    name: 'Pro',
    href: '#',
    from: true,
    priceMonthly: 25,
    warning: '+ additional use',
    description: 'For production applications with the option to scale.',
    features: [
      '8GB database & 100GB file storage',
      '50GB bandwith',
      '3GB file uploads',
      'Social OAuth providers',
      '2M Edge Function invocations',
      'Daily backups',
      '7-day log retention',
      'No project pausing',
      'Email support',
    ],
    scale: 'Additional fees apply for usage and storage beyond the limits above.',
    shutdown: '',
    preface: 'Everything below included in the base plan',
    additional: 'Need more? Turn off your spend cap to Pay As You Grow ',
    cta: 'Get Started',
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
    scale: '',
    shutdown: '',
    cta: 'Contact Us',
  },
}
