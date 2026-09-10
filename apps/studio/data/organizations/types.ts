import type { components } from 'api-types'

export type CustomerAddress = NonNullable<components['schemas']['CustomerResponse']['address']>
export type CustomerTaxId = NonNullable<components['schemas']['TaxIdResponse']['tax_id']>
