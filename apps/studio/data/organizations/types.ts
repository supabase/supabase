import type { components } from 'api-types'

export type CustomerAddress = NonNullable<
  components['schemas']['CustomerResponse_Output']['address']
>
export type CustomerTaxId = NonNullable<components['schemas']['TaxIdResponse_Output']['tax_id']>
