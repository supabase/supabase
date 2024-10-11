export const generatePrompt = ({
  type,
  context,
  schemas,
  tables,
}: {
  type: 'suggest' | 'examples' | 'ask'
  context: 'rls-policies' | 'functions'
  schemas: string[]
  tables: { schema: string; name: string }[]
}) => {
  if (type === 'examples') {
    return `What are some common examples of user-defined database ${context}?`
  } else if (type === 'ask') {
    return `Could you explain to me what are used-defined database ${context}?`
  } else if (type === 'suggest') {
    const output =
      context === 'functions'
        ? 'user-defined database functions'
        : context === 'rls-policies'
          ? 'RLS policies'
          : ''

    const suffix =
      context === 'functions' ? 'Let me know for which tables each function will be useful' : ''

    const basePrompt = `Suggest some ${output} that might be useful`

    if (tables.length > 0 && schemas.length > 0) {
      return `${basePrompt} for the following tables within this database: ${tables.map((x) => `${x.schema}.${x.name}`)}. ${suffix}`.trim()
    } else if (schemas.length > 0) {
      return `${basePrompt} for the tables in the following schemas within this database: ${schemas.join(', ')}. ${suffix}`.trim()
    }

    return basePrompt
  }
}
