import { TAX_IDS, TaxId } from './TaxID.constants'

/**
 * Returns the country code to send to Orb for tax validation.
 *
 * Most tax IDs use their display country (countryIso2), but some territories
 * share another country's tax system — e.g., Isle of Man uses GB VAT.
 * In these cases, taxCountryIso2 overrides the country sent to Orb.
 */
export const getEffectiveTaxCountry = (taxId: TaxId): string =>
  taxId.taxCountryIso2 ?? taxId.countryIso2

/**
 * Resolves a stored tax ID (from Orb) back to its TAX_IDS UI entry.
 *
 * Uses billingCountry (from the customer's address) to disambiguate when
 * multiple entries share the same Orb type+country — e.g., both "UK VAT"
 * and "IM VAT" map to {type: 'gb_vat', country: 'GB'} in Orb, but differ
 * by billing address country (GB vs IM).
 *
 * When billingCountry is unavailable, falls back to the stored country.
 */
export const resolveStoredTaxId = (
  type: string,
  taxCountry: string,
  billingCountry?: string
): TaxId | undefined => {
  const candidates = TAX_IDS.filter((option) => option.type === type)
  const preferredCountry = billingCountry ?? taxCountry

  return candidates.find((o) => o.countryIso2 === preferredCountry)
}

export const sanitizeTaxIdValue = (taxId: { name: string; value: string }) => {
  const selectedTaxId = TAX_IDS.find((option) => option.name === taxId.name)

  const vatIdPrefix = selectedTaxId?.vatPrefix

  // if the value doesn't start with the prefix, prepend them
  if (vatIdPrefix && !taxId.value.startsWith(vatIdPrefix)) {
    return `${vatIdPrefix}${taxId.value}`
  }

  return taxId.value
}

/** Ignore id property amongst tax ids */
export const checkTaxIdEqual = (a: any, b: any) => {
  return a?.type === b?.type && a?.value === b?.value
}
