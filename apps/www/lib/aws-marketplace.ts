/**
 * Buy with AWS procurement helpers.
 *
 * productId / sellerId from Thomas (AWS Marketplace Management Portal).
 */
export const AWS_MARKETPLACE_PRODUCT_ID = 'prod-hqz7ogrwmjmbm'
export const AWS_MARKETPLACE_SELLER_ID = 'seller-tvv3ohr7rtbr4'

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
