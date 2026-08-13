import { parseAsStringEnum } from 'nuqs'

/** Compute sizes recommended from the Add read replica sheet (close sheet → scroll + pre-select). */
export const RECOMMENDED_COMPUTE_FOR_READ_REPLICAS = {
  /** Minimum size that can deploy any read replicas. */
  minimum: 'ci_small',
  /** Size that unlocks the default max replica count (5). */
  unlockMaxReplicas: 'ci_xlarge',
} as const

export type RecommendedComputeForReadReplicas =
  (typeof RECOMMENDED_COMPUTE_FOR_READ_REPLICAS)[keyof typeof RECOMMENDED_COMPUTE_FOR_READ_REPLICAS]

export const recommendComputeParser = parseAsStringEnum<RecommendedComputeForReadReplicas>([
  RECOMMENDED_COMPUTE_FOR_READ_REPLICAS.minimum,
  RECOMMENDED_COMPUTE_FOR_READ_REPLICAS.unlockMaxReplicas,
]).withOptions({ history: 'replace', clearOnDefault: true })

type RecommendComputeListener = (size: RecommendedComputeForReadReplicas) => void

/**
 * In-page bridge from the Add read replica sheet → DiskManagementForm.
 * Avoids a nuqs race where closing the sheet unmounts the CTA before a second
 * query-param write can land.
 */
let recommendComputeListener: RecommendComputeListener | null = null

export function subscribeRecommendCompute(listener: RecommendComputeListener) {
  recommendComputeListener = listener
  return () => {
    if (recommendComputeListener === listener) {
      recommendComputeListener = null
    }
  }
}

/** Returns true when a subscriber received the recommendation. */
export function requestRecommendCompute(size: RecommendedComputeForReadReplicas) {
  if (!recommendComputeListener) return false
  recommendComputeListener(size)
  return true
}
