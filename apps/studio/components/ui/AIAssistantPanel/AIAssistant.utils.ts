import { SupportedAssistantEntities, SupportedAssistantQuickPromptTypes } from './AIAssistant.types'

const PLACEHOLDER_PREFIX = `-- Press tab to use this code
\n&nbsp;\n`

export const generatePlaceholder = () => {
  return `${PLACEHOLDER_PREFIX}
CREATE FUNCTION schema.function_name(param_list)\n
&nbsp;&nbsp;RETURNS return_type\n
&nbsp;&nbsp;LANGUAGE plpgsql\n
&nbsp;&nbsp;SECURITY DEFINER\n
&nbsp;&nbsp;SET search_path = ''\n
AS $$\n
DECLARE\n
&nbsp;&nbsp;-- Variable declarations\n
BEGIN\n
&nbsp;&nbsp;-- Function logic\n
END;\n
$$;
`
}

export const generatePrompt = ({
  type,
  context,
  schemas,
  tables,
}: {
  type: SupportedAssistantQuickPromptTypes
  context: SupportedAssistantEntities
  schemas: string[]
  tables: { schema: string; name: string }[]
}) => {
  if (type === 'examples') {
    return `What are some common examples of user-defined database ${context}? Give me just three examples will do.`
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
