import { ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from 'ui'

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
 * Primary Button wired to Buy with AWS procurement + partner.js click tracking.
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
      variant="primary"
      size={size}
      // Sizing to optically match sibling "Request a private offer" button
      iconRight={<ExternalLink className="h-4! w-4!" />}
      className={className}
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
