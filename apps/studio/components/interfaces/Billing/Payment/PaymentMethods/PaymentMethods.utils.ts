import { BASE_PATH } from '@/lib/constants'

export const CARD_BRAND_ICON_FILES: ReadonlyMap<string, string> = new Map([
  ['amex', 'amex'],
  ['diners', 'diners-club'],
  ['discover', 'discover'],
  ['jcb', 'jcb'],
  ['mastercard', 'mastercard'],
  ['visa', 'visa'],
])

export function getCardBrandIconUrl(brand: string | null | undefined): string | undefined {
  const file = brand ? CARD_BRAND_ICON_FILES.get(brand.toLowerCase()) : undefined
  if (!file) return undefined
  return `${BASE_PATH}/img/payment-methods/${file}.png`
}
