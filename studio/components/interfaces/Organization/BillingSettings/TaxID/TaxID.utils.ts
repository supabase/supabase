import { StripeTaxId, TAX_IDS } from './TaxID.constants'

/**
 * Sanitize EU VAT ids so they get prepended with the country code
 *
 * Ex: Belgium's VAT ID should be BE0123456789 not 0123456789
 * Only EU VAT ids are affected
 */
export const sanitizeTaxID = (taxId: StripeTaxId) => {
  let newID = taxId

  const selectedTaxId = TAX_IDS.find((option) => option.name === taxId.name)

  // The prefix of the country name (ex: "BE" for Belgium, "ESA" for Spain)")
  const countryPrefix = selectedTaxId?.placeholder.match(/[a-z]+|[^a-z]+/gi)?.[0]

  // if the value doesn't start with the country code, prepend them
  if (taxId.type === 'eu_vat' && countryPrefix && !taxId.value.startsWith(countryPrefix)) {
    newID.value = `${countryPrefix}${taxId.value}`
  }

  return newID
}
