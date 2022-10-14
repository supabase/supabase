import { PolicyFormField } from 'components/interfaces/Auth/Policies/Policies.types'

export interface StoragePolicyFormField extends PolicyFormField {
  allowedOperations: string[]
}
