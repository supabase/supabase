import Script from 'next/script'

import { AWS_MARKETPLACE_PARTNER_SCRIPT_SRC } from '@/lib/aws-marketplace'

/** Loads AWS Marketplace Buy with AWS click / funnel tracking. */
export function BuyWithAwsScript() {
  return <Script src={AWS_MARKETPLACE_PARTNER_SCRIPT_SRC} strategy="afterInteractive" />
}
