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

  const vatIdPrefix = selectedTaxId?.vatPrefix

  // if the value doesn't start with the prefix, prepend them
  if (vatIdPrefix && !taxId.value.startsWith(vatIdPrefix)) {
    newID.value = `${vatIdPrefix}${taxId.value}`
  }

  return newID
}
