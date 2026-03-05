import { useProjectPostgrestConfigQuery } from '@/data/config/project-postgrest-config-query'

/**
 * Returns whether the Data API is enabled for the given project.
 *
 * The Data API is considered enabled when the PostgREST `db_schema` config
 * contains at least one non-empty schema name.
 */
export const useIsDataApiEnabled = ({ projectRef }: { projectRef?: string }) => {
  const { data: config, ...rest } = useProjectPostgrestConfigQuery({ projectRef })

  const isEnabled = !!config?.db_schema?.trim()

  return { ...rest, data: isEnabled, isEnabled }
}
