import { resolveStoredTaxId } from '@/components/interfaces/Organization/BillingSettings/BillingCustomerData/TaxID.utils'
import type { CustomerAddress, CustomerTaxId } from '@/data/organizations/types'

const CARD_BRAND_NAMES: Record<string, string> = {
  amex: 'American Express',
  diners: 'Diners Club',
  discover: 'Discover',
  jcb: 'JCB',
  mastercard: 'Mastercard',
  unionpay: 'UnionPay',
  visa: 'Visa',
}

/** "visa" → "Visa". Brands Stripe adds later fall back to a capitalized identifier. */
export const getCardBrandName = (brand: string | null | undefined) => {
  if (!brand) return 'Card'
  return CARD_BRAND_NAMES[brand] ?? `${brand.charAt(0).toUpperCase()}${brand.slice(1)}`
}

/** "Visa •••• 4242", or just the brand when the last four digits are unknown. */
export const getCardTitle = (
  card: { brand?: string | null; last4?: string | null } | undefined
) => {
  const brand = getCardBrandName(card?.brand)
  return card?.last4 ? `${brand} •••• ${card.last4}` : brand
}

/** "10/28" from a card's expiry month and year, or null when either is missing. */
export const getCardExpiry = (card: { exp_month?: number; exp_year?: number } | undefined) => {
  if (!card?.exp_month || !card.exp_year) return null

  const month = String(card.exp_month).padStart(2, '0')
  const year = String(card.exp_year).slice(-2)
  return `${month}/${year}`
}

/** "SG" → "Singapore". Unknown or malformed codes are shown as they were stored. */
const getCountryName = (countryCode: string) => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode) ?? countryCode
  } catch {
    return countryCode
  }
}

/**
 * One line a customer recognizes as their billing address, e.g.
 * "60 Telok Blangah Heights, Singapore 100060" or
 * "1 Main St, San Francisco, CA 94107, United States".
 *
 * The country is spelled out because it decides which taxes apply, but dropped when the
 * city already says it — "Singapore 100060, Singapore" reads as a mistake.
 */
export const formatBillingAddress = (address: CustomerAddress) => {
  const country = getCountryName(address.country)
  const street = [address.line1, address.line2].filter(Boolean).join(', ')
  const region = [address.city, address.state].filter(Boolean).join(', ')
  const locality = [region, address.postal_code].filter(Boolean).join(' ')
  const isCountryRepeated = region.toLowerCase().includes(country.toLowerCase())

  return [street, locality, isCountryRepeated ? null : country].filter(Boolean).join(', ')
}

/**
 * "SG GST M12345678X": the tax ID's name as it is picked in the billing form, then its
 * value. A type the form no longer lists is shown by its stored identifier instead.
 */
export const formatTaxId = (taxId: CustomerTaxId, billingCountry?: string) => {
  const name = resolveStoredTaxId(taxId.type, taxId.country, billingCountry)?.name ?? taxId.type
  return `${name} ${taxId.value}`
}
