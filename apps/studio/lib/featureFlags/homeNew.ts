// Temporary helper for the homeNew experiment rollout.
export type HomeNewFlagValue = 'control' | 'new-home' | boolean | undefined

export const isHomeNewVariant = (value: HomeNewFlagValue) => value === true || value === 'new-home'
