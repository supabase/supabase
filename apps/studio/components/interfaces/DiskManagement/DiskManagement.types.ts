import { AddonVariantId, ProjectAddonVariantMeta } from 'data/subscriptions/types'

export type ComputeInstanceAddonVariantId =
  | Extract<
      AddonVariantId,
      | 'ci_micro'
      | 'ci_small'
      | 'ci_medium'
      | 'ci_large'
      | 'ci_xlarge'
      | 'ci_2xlarge'
      | 'ci_4xlarge'
      | 'ci_8xlarge'
      | 'ci_12xlarge'
      | 'ci_16xlarge'
    >
  | 'ci_nano'

export type ComputeInstanceSize =
  | 'Nano'
  | 'Micro'
  | 'Small'
  | 'Medium'
  | 'Large'
  | 'XL'
  | '2XL'
  | '4XL'
  | '8XL'
  | '12XL'
  | '16XL'

export type InfraInstanceSize =
  | 'nano'
  | 'micro'
  | 'small'
  | 'medium'
  | 'large'
  | 'xlarge'
  | '2xlarge'
  | '4xlarge'
  | '8xlarge'
  | '12xlarge'
  | '16xlarge'

export interface DiskManagementMessage {
  message: string
  type: 'error' | 'success'
}
