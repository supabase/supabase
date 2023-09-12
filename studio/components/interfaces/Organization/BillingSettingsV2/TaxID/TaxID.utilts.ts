import { TaxIdValue } from 'data/organizations/organization-tax-ids-update-mutation'
import { TAX_IDS } from './TaxID.constants'
import { isEqual, sortBy } from 'lodash'

export const sanitizeTaxID = (taxId: TaxIdValue) => {
  let newID = taxId

  const selectedTaxId = TAX_IDS.find((option) => option.name === taxId.name)

  const vatIdPrefix = selectedTaxId?.vatPrefix

  // if the value doesn't start with the prefix, prepend them
  if (vatIdPrefix && !taxId.value.startsWith(vatIdPrefix)) {
    newID.value = `${vatIdPrefix}${taxId.value}`
  }

  return newID
}

/** Ignore id property amongst tax ids */
export const checkTaxIdsEqual = (a: any[], b: any[]) => {
  const aExcludeId = a.map((x) => {
    return { type: x.type, value: x.value, name: x.name }
  })
  const bExcludeId = b.map((x) => {
    return { type: x.type, value: x.value, name: x.name }
  })
  return isEqual(sortBy(aExcludeId, 'name'), sortBy(bExcludeId, 'name'))
}
