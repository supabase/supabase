import type { Toolset } from '../registry.ts'
import { loadApiSchema } from './schema.ts'
import { registerSchemaTools } from './tools.ts'

// A toolset that generates its tools from the database, rather than declaring
// them. On each request it reads the description PostgREST serves at the REST
// root and registers read and write tools for every table, updatable view, and
// function the calling user is allowed to see.
//
// Nothing here is generated at build time, so a new table becomes a new set of
// tools as soon as the schema cache expires — no redeploy.

export const postgrestToolset: Toolset = {
  name: 'postgrest',
  description: 'Database tools generated from the PostgREST schema.',
  async register(server, { supabase, accessToken }) {
    const schema = await loadApiSchema(accessToken)
    registerSchemaTools(server, supabase, schema)
  },
}
