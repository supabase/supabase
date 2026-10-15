import { ArrowUpRight, Check } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'

import Panel from '../Panel'
import { AWS_MARKETPLACE_LISTING_URL } from '@/lib/aws-marketplace'

const points = [
  'Apply eligible Supabase spend toward an existing AWS commitment (PPA or EDP).',
  'AWS manages billing details, payment methods, and plan changes.',
  'Pro and Team are available self-serve; Enterprise is available via private offer.',
]

const PricingAwsMarketplaceSection = () => (
  <div>
    <div className="text-center mb-8 lg:mb-16">
      <h2 className="text-foreground text-3xl">Purchase through AWS Marketplace</h2>
      <p className="text-foreground-light mt-4 text-lg mb-4 max-w-2xl mx-auto">
        Apply Supabase spend toward an existing AWS commitment.
      </p>
    </div>

    <Panel outerClassName="mx-auto max-w-3xl" innerClassName="flex flex-col gap-8 p-6 lg:p-10">
      <p className="text-foreground-light text-base text-pretty m-0 text-center lg:text-left">
        Eligible organizations can buy through AWS Marketplace so charges count against an AWS spend
        commitment instead of a separate card payment. Supabase stays the same; procurement and
        billing run through AWS.
      </p>

      <ul className="space-y-3 m-0 p-0 list-none">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-3 text-foreground-light">
            <Check size={16} className="mt-1 shrink-0 text-primary" strokeWidth={2} />
            <span className="text-sm text-pretty">{point}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap justify-center lg:justify-start gap-2">
        <Button asChild size="tiny" iconRight={<ArrowUpRight className="w-4" />}>
          <Link href="/aws-marketplace">Learn about AWS Marketplace</Link>
        </Button>
        <Button asChild size="tiny" iconRight={<ArrowUpRight className="w-4" />}>
          <a href={AWS_MARKETPLACE_LISTING_URL} target="_blank" rel="noreferrer">
            View on AWS Marketplace
          </a>
        </Button>
      </div>
    </Panel>
  </div>
)

export default PricingAwsMarketplaceSection
