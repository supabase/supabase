export const MULTIGRES_SCHEMA_NAME = 'multigres'

/** @deprecated use useIsHighAvailability hook instead */
export function resolveHighAvailability(project?: { high_availability?: boolean | null }) {
  return project?.high_availability ?? false
}
