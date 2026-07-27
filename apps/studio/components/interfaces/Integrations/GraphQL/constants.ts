import { DOCS_URL } from '@/lib/constants'

export const PG_GRAPHQL_EXTENSION_NAME = 'pg_graphql'

/**
 * The Postgres schema we check (and rewrite) the `@graphql(...)` directive on.
 * `public` is the conventional user-data schema in Supabase projects, and
 * pg_graphql treats each schema's introspection setting independently.
 */
export const DEFAULT_INTROSPECTION_SCHEMA = 'public'

export const PG_GRAPHQL_CONFIG_DOCS_URL = `${DOCS_URL}/guides/graphql#supabase-studio`
