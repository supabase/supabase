import { PolicyFormField } from 'components/interfaces/Authentication/Policies/Policies.types'

export interface StoragePolicyFormField extends PolicyFormField {
  allowedOperations: string[]
}
