import { AddonVariantId } from '@/data/subscriptions/types'

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
      | 'ci_24xlarge'
      | 'ci_24xlarge_optimized_cpu'
      | 'ci_24xlarge_optimized_memory'
      | 'ci_24xlarge_high_memory'
      | 'ci_48xlarge'
      | 'ci_48xlarge_optimized_cpu'
      | 'ci_48xlarge_optimized_memory'
      | 'ci_48xlarge_high_memory'
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
  | '24XL'
  | '24XL - Optimized CPU'
  | '24XL - Optimized Memory'
  | '24XL - High Memory'
  | '48XL'
  | '48XL - Optimized CPU'
  | '48XL - Optimized Memory'
  | '48XL - High Memory'

export type InfraInstanceSize =
  | 'pico'
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
  | '24xlarge'
  | '24xlarge_optimized_memory'
  | '24xlarge_optimized_cpu'
  | '24xlarge_high_memory'
  | '48xlarge'
  | '48xlarge_optimized_memory'
  | '48xlarge_optimized_cpu'
  | '48xlarge_high_memory'

export interface DiskManagementMessage {
  message: string
  type: 'error' | 'success'
}

/** A guardrail that exists to stop a customer from taking on new, expensive disk
 *  provisioning: compute size below Large, or an org-level spend cap. */
export type DiskConfigGuardrail = 'computeSize' | 'spendCap'

/** Whether storageType/provisionedIOPS/throughput can be edited, and why not.
 *  - `editable`: no active guardrail: any value is allowed (subject to the normal disk limits).
 *  - `locked`: a guardrail is active and the persisted config is already within bounds, so no
 *    edits are offered — or a reason unrelated to cost (permissions, plan, cooldown, HA, a
 *    pending modification) blocks editing outright, in which case `guardrails` is empty.
 *  - `downsizeOnly`: a guardrail is active AND the persisted config already exceeds it (e.g. set
 *    before the guardrail took effect). Fields stay editable, but only to move values down —
 *    never to increase them further while the guardrail remains active.
 */
export type DiskConfigEditability =
  | { status: 'editable' }
  | { status: 'locked'; guardrails: DiskConfigGuardrail[] }
  | { status: 'downsizeOnly'; guardrails: DiskConfigGuardrail[] }
