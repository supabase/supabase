import { ExternalLink } from 'lucide-react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import PartnerIcon from '@/components/ui/PartnerIcon'
import { MANAGED_BY } from '@/lib/constants/infrastructure'

const AWS_MARKETPLACE_URL = 'https://supabase.com/aws-marketplace'

export function AwsMarketplacePurchaseCallout() {
  return (
    <Admonition
      type="default"
      layout="responsive"
      className="w-full"
      icon={
        <PartnerIcon
          organization={{ managed_by: MANAGED_BY.AWS_MARKETPLACE }}
          showTooltip={false}
          size="medium"
        />
      }
      title="Prefer purchasing through AWS Marketplace?"
      description="Apply Supabase spend toward an AWS commitment and manage billing through AWS."
      actions={
        <Button asChild variant="default" iconRight={<ExternalLink />}>
          <a href={AWS_MARKETPLACE_URL} target="_blank" rel="noreferrer">
            View options
          </a>
        </Button>
      }
    />
  )
}
