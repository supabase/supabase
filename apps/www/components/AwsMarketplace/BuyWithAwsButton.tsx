import { ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button, cn } from 'ui'

import { AwsSmileIcon } from './AwsSmileIcon'
import {
  AWS_MARKETPLACE_LANDING_URL,
  AWS_MARKETPLACE_PRODUCT_ID,
  AWS_MARKETPLACE_SELLER_ID,
  getBuyWithAwsProcurementUrl,
} from '@/lib/aws-marketplace'

type BuyWithAwsButtonProps = {
  size?: 'tiny' | 'small' | 'medium' | 'large'
  className?: string
  /** Page URL AWS should return to from the co-branded procurement Cancel / breadcrumb. */
  sourceUrl?: string
  children?: ReactNode
}

/**
 * Our Button, styled for AWS and wired for Buy with AWS click tracking.
 * Uses partner.js data attributes rather than AWS’s stock button markup.
 */
export function BuyWithAwsButton({
  size = 'medium',
  className,
  sourceUrl = AWS_MARKETPLACE_LANDING_URL,
  children = 'Buy with AWS',
}: BuyWithAwsButtonProps) {
  return (
    <Button
      asChild
      size={size}
      icon={<AwsSmileIcon className="text-[#16191F]" />}
      iconRight={<ExternalLink className="text-[#16191F]" />}
      className={cn(
        // Callsite override: AWS Marketplace orange CTA (not a semantic Studio token).
        'border-transparent bg-[#FF9900] text-[#16191F] hover:bg-[#EC7211] hover:text-[#16191F]',
        className
      )}
      data-awsmp-bwa-cta="BuyWithAws"
      data-awsmp-bwa-seller-id={AWS_MARKETPLACE_SELLER_ID}
      data-awsmp-bwa-product-id={AWS_MARKETPLACE_PRODUCT_ID}
    >
      <a href={getBuyWithAwsProcurementUrl(sourceUrl)} target="_blank" rel="noreferrer">
        {children}
      </a>
    </Button>
  )
}
