import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'

import { AWS_MARKETPLACE_LISTING_URL } from '@/lib/aws-marketplace'

const PricingAwsMarketplaceSection = () => (
  <div>
    <div className="text-center mb-8 lg:mb-12">
      <h2 className="text-foreground text-3xl">Purchase through AWS Marketplace</h2>
      <p className="text-foreground-light mt-4 text-lg mb-4 max-w-2xl mx-auto">
        Apply Supabase spend toward an existing AWS commitment.
      </p>
      <p className="text-foreground-lighter text-base max-w-2xl mx-auto">
        Eligible organizations can buy Pro or Team through AWS Marketplace so charges count against
        an AWS spend commitment. Billing details and plan management then run through AWS.
      </p>
    </div>
    <div className="flex flex-wrap justify-center gap-2">
      <Button asChild size="tiny" iconRight={<ArrowUpRight className="w-4" />}>
        <Link href="/aws-marketplace">Learn about AWS Marketplace</Link>
      </Button>
      <Button asChild size="tiny" iconRight={<ArrowUpRight className="w-4" />}>
        <a href={AWS_MARKETPLACE_LISTING_URL} target="_blank" rel="noreferrer">
          View on AWS Marketplace
        </a>
      </Button>
    </div>
  </div>
)

export default PricingAwsMarketplaceSection
