import { authKeys } from 'data/auth/keys'
import { databaseExtensionsKeys } from 'data/database-extensions/keys'
import { databasePoliciesKeys } from 'data/database-policies/keys'
import { databaseTriggerKeys } from 'data/database-triggers/keys'
import { databaseKeys } from 'data/database/keys'
import { enumeratedTypesKeys } from 'data/enumerated-types/keys'
import { tableKeys } from 'data/tables/keys'
import { SAFE_FUNCTIONS } from './AiAssistant.constants'

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

// Check for function calls that aren't in the safe list
export const containsUnknownFunction = (query: string) => {
  const normalizedQuery = query.trim().toLowerCase()
  const functionCallRegex = /\w+\s*\(/g
  const functionCalls = normalizedQuery.match(functionCallRegex) || []

  return functionCalls.some((func) => {
    const isReadOnlyFunc = SAFE_FUNCTIONS.some((safeFunc) => func.trim().toLowerCase() === safeFunc)
    return !isReadOnlyFunc
  })
}

export const isReadOnlySelect = (query: string): boolean => {
  const normalizedQuery = query.trim().toLowerCase()

  // Check if it starts with SELECT
  if (!normalizedQuery.startsWith('select')) return false

  // List of keywords that indicate write operations
  const writeOperations = ['insert', 'update', 'delete', 'alter', 'drop', 'create', 'replace']

  // Words that may appear in column names etc
  const allowedPatterns = ['created', 'inserted', 'updated', 'deleted', 'truncate']

  // Check for any write operations
  const hasWriteOperation = writeOperations.some((op) => {
    // Ignore if part of allowed pattern
    const isAllowed = allowedPatterns.some(
      (allowed) => normalizedQuery.includes(allowed) && allowed.includes(op)
    )
    return !isAllowed && normalizedQuery.includes(op)
  })
  if (hasWriteOperation) return false

  const hasUnknownFunction = containsUnknownFunction(normalizedQuery)
  if (hasUnknownFunction) return false

  return true
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
