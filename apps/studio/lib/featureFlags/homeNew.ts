/**
 * Temporary helper for the homeNew experiment rollout.
 *
 * PostHog requires string variants for A/B test analysis, but we initially implemented
 * this flag as a boolean. This helper supports both formats during the migration period
 * to avoid disrupting existing users.
 *
 * Once migration is complete, we'll use only string values ('control'/'new-home') and
 * this helper can be removed.
 */
export type HomeNewFlagValue = 'control' | 'new-home' | boolean | undefined

/**
 * Checks if the homeNew flag value indicates the new home experience should be shown.
 *
 * @param value - The PostHog flag value (boolean, string variant, or undefined)
 * @returns true if user should see the new home (true or 'new-home')
 *
 * @example
 * const variant = usePHFlag<HomeNewFlagValue>('homeNew')
 * const shouldShowNewHome = isHomeNewVariant(variant)
 * // Returns true for: true or 'new-home'
 * // Returns false for: false, 'control', or undefined
 */
export const isHomeNewVariant = (value: HomeNewFlagValue): boolean =>
  value === true || value === 'new-home'
