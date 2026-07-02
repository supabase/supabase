export const MULTIGRES_SCHEMA_NAME = 'multigres'

export function resolveHighAvailability(project?: { high_availability?: boolean | null }) {
  return project?.high_availability ?? false
}
