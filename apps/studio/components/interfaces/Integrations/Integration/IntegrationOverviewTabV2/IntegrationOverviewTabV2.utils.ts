import { getEnableDatabaseExtensionSQL } from '@supabase/pg-meta'

import { DatabaseExtension } from '@/data/database-extensions/database-extensions-query'

export const getEnableExtensionsSQL = ({
  extensions,
  extensionsSchema,
}: {
  extensions: DatabaseExtension[]
  extensionsSchema: {
    [key: string]: { schema: string; value: string | undefined }
  }
}) => {
  return extensions
    .map((extension) => {
      /**
       * [Joshen] Hard-coding pg_cron here as this is enforced on our end (Not via pg_available_extension_versions)
       * Also temp hardcoding to `extensions` for now, but we should be retrieving the default schema from `pg_available_extension_versions`
       * Am checking with pg-meta team whether we can just return that data directly from the /pg-meta/extensions endpoint, rather
       * than using dashboard's `useDatabaseExtensionDefaultSchemaQuery` - we can technically save a query if so
       */
      const { name, default_version: version } = extension
      const createSchema = extensionsSchema[name].schema === 'custom'
      const schema =
        name === 'pg_cron'
          ? 'pg_catalog'
          : createSchema
            ? (extensionsSchema[name].value as string)
            : extensionsSchema[name].schema

      return getEnableDatabaseExtensionSQL({
        schema,
        name,
        version,
        cascade: true,
        createSchema,
      })
    })
    .filter(Boolean)
    .join('\n\n')
    .trim()
}

export const getExtensionDefaultSchema = (ext?: DatabaseExtension) => {
  if (!ext) return null
  return ext.name === 'pg_cron' ? 'pg_catalog' : ext.default_version_schema
}
