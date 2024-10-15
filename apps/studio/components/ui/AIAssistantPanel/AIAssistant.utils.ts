import { SupportedAssistantEntities, SupportedAssistantQuickPromptTypes } from './AIAssistant.types'

const PLACEHOLDER_PREFIX = `-- Press tab to use this code
\n&nbsp;\n`

const PLACEHOLDER_LIMIT = `Just three examples will do.`

export const generateTitle = (editor?: SupportedAssistantEntities) => {
  if (editor === 'functions') return 'Create a new function'
  return 'SQL Scratch Pad'
}

export const generateCTA = (editor?: SupportedAssistantEntities) => {
  if (editor === 'functions') return 'Save function'
  return 'Run query'
}

export const generatePlaceholder = (editor?: SupportedAssistantEntities) => {
  if (editor === 'functions') {
    return `${PLACEHOLDER_PREFIX}
CREATE FUNCTION schema.function_name(param1 type, param2 type)\n
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
  } else {
    return undefined
  }
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
    return `What are some common examples of user-defined database ${context}? ${PLACEHOLDER_LIMIT}`
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
      return `${basePrompt} for the following tables within this database: ${tables.map((x) => `${x.schema}.${x.name}`)}. ${PLACEHOLDER_LIMIT} ${suffix}`.trim()
    } else if (schemas.length > 0) {
      return `${basePrompt} for the tables in the following schemas within this database: ${schemas.join(', ')}. ${suffix}`.trim()
    }

    return basePrompt
  }
}

// [Joshen] This is just very basic validation, but possible can extend perhaps
export const validateQuery = (editor: SupportedAssistantEntities, query: string) => {
  const formattedQuery = query.toLowerCase().replaceAll('\n', ' ')

  switch (editor) {
    case 'functions':
      return (
        formattedQuery.includes('create function') ||
        formattedQuery.includes('create or replace function')
      )
    case 'rls-policies':
      return true
    default:
      return true
  }
}
