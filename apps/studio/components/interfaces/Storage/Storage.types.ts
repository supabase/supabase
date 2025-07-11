import type { PolicyFormField } from 'components/interfaces/Auth/Policies/Policies.types'

export interface StoragePolicyFormField extends PolicyFormField {
  allowedOperations: string[]
}

export interface BucketUpdatePayload {
  public?: boolean
  file_size_limit?: number | null
  allowed_mime_types?: string[] | null
}

export interface BucketCreatePayload extends BucketUpdatePayload {
  id: string
  name?: string
}
