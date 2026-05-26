import { registerTool } from '../registry.ts'

registerTool({
  name: 'list_tables',
  description: 'List tables in a schema of the connected Supabase database.',
  inputSchema: {
    type: 'object',
    properties: {
      schema: {
        type: 'string',
        description: 'Schema name to inspect. Defaults to "public".',
      },
    },
    additionalProperties: false,
  },
  async handler(args, { supabase }) {
    const schema = typeof args.schema === 'string' ? args.schema : 'public'

    const { data, error } = await supabase
      .schema('information_schema')
      .from('tables')
      .select('table_name')
      .eq('table_schema', schema)
      .order('table_name')

    if (error) throw new Error(error.message)

    return { schema, tables: data?.map((t) => t.table_name) ?? [] }
  },
})
