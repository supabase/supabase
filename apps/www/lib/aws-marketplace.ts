/**
 * Buy with AWS procurement helpers.
 *
 * TODO(aws-marketplace): replace productId and sellerId with the real values from
 * Sana / AWS Marketplace Management Portal (Settings → Tags → Seller ARN for sellerId).
 * Tracking and the co-branded procurement page will not work until these are set.
 */
export const AWS_MARKETPLACE_PRODUCT_ID = 'TODO_PRODUCT_ID'
export const AWS_MARKETPLACE_SELLER_ID = 'TODO_SELLER_ID'

export const AWS_MARKETPLACE_PARTNER_SCRIPT_SRC =
  'https://bwa.marketplace.awsstatic.com/assets/partner.js'

export const AWS_MARKETPLACE_LANDING_URL = 'https://supabase.com/aws-marketplace'
export const AWS_MARKETPLACE_DOCS_URL = '/docs/guides/platform/aws-marketplace'
export const AWS_MARKETPLACE_LISTING_URL =
  'https://aws.amazon.com/marketplace/pp/prodview-zjciuce2qsb3q'

export function getBuyWithAwsProcurementUrl(sourceUrl = AWS_MARKETPLACE_LANDING_URL) {
  const params = new URLSearchParams({
    productId: AWS_MARKETPLACE_PRODUCT_ID,
    sellerId: AWS_MARKETPLACE_SELLER_ID,
    isBuyWithAWS: 'true',
    sourceURL: sourceUrl,
  })

  return `https://aws.amazon.com/marketplace/procurement?${params.toString()}`
}
