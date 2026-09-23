/** Compute sizes recommended from the Add read replica sheet (close sheet → scroll + pre-select). */
export const RECOMMENDED_COMPUTE_FOR_READ_REPLICAS = {
  /** Minimum size that can deploy any read replicas. */
  minimum: 'ci_small',
  /** Size that unlocks the default max replica count (5). */
  unlockMaxReplicas: 'ci_xlarge',
} as const

export type RecommendedComputeForReadReplicas =
  (typeof RECOMMENDED_COMPUTE_FOR_READ_REPLICAS)[keyof typeof RECOMMENDED_COMPUTE_FOR_READ_REPLICAS]
