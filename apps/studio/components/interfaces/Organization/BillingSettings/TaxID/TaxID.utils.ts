import { TAX_IDS } from './TaxID.constants'

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
