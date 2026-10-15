import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { AwsSmileIcon } from '@/components/AwsMarketplace/AwsSmileIcon'

export function AwsMarketplacePurchaseCallout() {
  return (
    <Admonition
      type="default"
      layout="responsive"
      className="w-full"
      icon={<AwsSmileIcon className="text-foreground" />}
      title="Prefer purchasing through AWS Marketplace?"
      description="Apply Supabase spend toward an AWS commitment and manage billing through AWS."
      actions={
        <Button asChild variant="default" iconRight={<ExternalLink />}>
          <Link href="/aws-marketplace">View options</Link>
        </Button>
      }
    />
  )
}
