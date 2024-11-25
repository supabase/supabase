import { authKeys } from 'data/auth/keys'
import { databaseExtensionsKeys } from 'data/database-extensions/keys'
import { databasePoliciesKeys } from 'data/database-policies/keys'
import { databaseTriggerKeys } from 'data/database-triggers/keys'
import { databaseKeys } from 'data/database/keys'
import { enumeratedTypesKeys } from 'data/enumerated-types/keys'
import { tableKeys } from 'data/tables/keys'
import { CommonDatabaseEntity } from 'state/app-state'
import { SupportedAssistantEntities } from './AIAssistant.types'

const PLACEHOLDER_PREFIX = `-- Press tab to use this code
\n&nbsp;\n`

// [Joshen] Not used but keeping this for now in case we do an inline editor
export const generatePlaceholder = (
  editor?: SupportedAssistantEntities | null,
  entity?: CommonDatabaseEntity,
  existingDefinition?: string
) => {
  switch (editor) {
    case 'functions':
      if (entity === undefined) {
        return `${PLACEHOLDER_PREFIX}
CREATE FUNCTION *schema*.*function_name*(*param1 type*, *param2 type*)\n
&nbsp;&nbsp;RETURNS *return_type*\n
&nbsp;&nbsp;LANGUAGE *plpgsql*\n
&nbsp;&nbsp;SECURITY DEFINER\n
&nbsp;&nbsp;SET *search_path = ''*\n
AS $$\n
DECLARE\n
&nbsp;&nbsp;*-- Variable declarations*\n
BEGIN\n
&nbsp;&nbsp;*-- Function logic*\n
END;\n
$$;
`
      } else {
        return `${PLACEHOLDER_PREFIX}
-- To rename the function\n
ALTER FUNCTION *${entity.name}* RENAME TO *new_name*;\n
&nbsp;\n
-- To change the schema of the function\n
ALTER FUNCTION *${entity.name}* SET SCHEMA *new_schema*;\n
&nbsp;\n
-- To update the function body or the arguments, use\n
-- the create or replace statement instead\n
${existingDefinition
  ?.replaceAll(
    '\n ',
    `\n\
  &nbsp;&nbsp;`
  )
  .replaceAll('\n', '\n\n')
  .trim()}
`
      }
    case 'rls-policies':
      if (entity === undefined) {
        return `${PLACEHOLDER_PREFIX}
CREATE POLICY *name* ON *table_name*\n
AS PERMISSIVE -- PERMISSIVE | RESTRICTIVE\n
FOR ALL -- ALL | SELECT | INSERT | UPDATE | DELETE\n
TO *role_name* -- Default: public\n
USING ( *using_expression* )\n
WITH CHECK ( *check_expression* );
`
      } else {
        let expression = ''
        if (entity.definition !== null && entity.definition !== undefined) {
          expression += `USING ( *${entity.definition}* )${
            entity.check === null || entity.check === undefined ? ';' : ''
          }\n`
        }
        if (entity.check !== null && entity.check !== undefined) {
          expression += `WITH CHECK ( *${entity.check}* );\n`
        }
        return `${PLACEHOLDER_PREFIX}
BEGIN;\n
&nbsp;\n
-- To update your policy definition\n
ALTER POLICY "${entity.name}"\n
ON "${entity.schema}"."${entity.table}"\n
TO *${(entity.roles ?? []).join(', ')}*\n
${expression}
&nbsp;\n
-- To rename the policy\n
ALTER POLICY "${entity.name}"\n
ON "${entity.schema}"."${entity.table}"\n
RENAME TO "*New Policy Name*";\n
&nbsp;\n
COMMIT;
`
      }
    default:
      return undefined
  }
}

// [Joshen] This is just very basic identification, but possible can extend perhaps
export const identifyQueryType = (query: string) => {
  const formattedQuery = query.toLowerCase().replaceAll('\n', ' ')
  if (
    formattedQuery.includes('create function') ||
    formattedQuery.includes('create or replace function')
  ) {
    return 'functions'
  } else if (formattedQuery.includes('create policy') || formattedQuery.includes('alter policy')) {
    return 'rls-policies'
  }
}

export const isReadOnlySelect = (query: string): boolean => {
  const normalizedQuery = query.trim().toLowerCase()

  // Check if it starts with SELECT
  if (!normalizedQuery.startsWith('select')) {
    return false
  }

  // List of keywords that indicate write operations or function calls
  const disallowedPatterns = [
    // Write operations
    'insert',
    'update',
    'delete',
    'alter',
    'drop',
    'create',
    'truncate',
    'replace',
    'with',

    // Function patterns
    'function',
    'procedure',
  ]

  const allowedPatterns = ['created', 'inserted', 'updated', 'deleted']

  // Check if query contains any disallowed patterns, but allow if part of allowedPatterns
  return !disallowedPatterns.some((pattern) => {
    // Check if the found disallowed pattern is actually part of an allowed pattern
    const isPartOfAllowedPattern = allowedPatterns.some(
      (allowed) => normalizedQuery.includes(allowed) && allowed.includes(pattern)
    )

    if (isPartOfAllowedPattern) {
      return false
    }

    return normalizedQuery.includes(pattern)
  })
}

const getContextKey = (pathname: string) => {
  const [_, __, ___, ...rest] = pathname.split('/')
  const key = rest.join('/')
  return key
}

export const getContextualInvalidationKeys = ({
  ref,
  pathname,
  schema = 'public',
}: {
  ref: string
  pathname: string
  schema?: string
}) => {
  const key = getContextKey(pathname)

  return (
    (
      {
        'auth/users': [authKeys.usersInfinite(ref)],
        'auth/policies': [databasePoliciesKeys.list(ref)],
        'database/functions': [databaseKeys.databaseFunctions(ref)],
        'database/tables': [tableKeys.list(ref, schema, true), tableKeys.list(ref, schema, false)],
        'database/triggers': [databaseTriggerKeys.list(ref)],
        'database/types': [enumeratedTypesKeys.list(ref)],
        'database/extensions': [databaseExtensionsKeys.list(ref)],
        'database/indexes': [databaseKeys.indexes(ref, schema)],
      } as const
    )[key] ?? []
  )
}
