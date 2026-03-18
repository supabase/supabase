import { authKeys } from 'data/auth/keys'
import { databaseExtensionsKeys } from 'data/database-extensions/keys'
import { databaseIndexesKeys } from 'data/database-indexes/keys'
import { databasePoliciesKeys } from 'data/database-policies/keys'
import { databaseTriggerKeys } from 'data/database-triggers/keys'
import { databaseKeys } from 'data/database/keys'
import { enumeratedTypesKeys } from 'data/enumerated-types/keys'
import { handleError } from 'data/fetchers'
import { tableKeys } from 'data/tables/keys'
import { tryParseJson } from 'lib/helpers'
import { toast } from 'sonner'
import { ResponseError } from 'types'

import { SAFE_FUNCTIONS } from './AiAssistant.constants'

// [Joshen] This is just very basic identification, but possible can extend perhaps
export const identifyQueryType = (query: string) => {
  const formattedQuery = query.toLowerCase().replaceAll('\n', ' ')
  if (
    formattedQuery.includes('create function') ||
    formattedQuery.includes('create or replace function') ||
    formattedQuery.includes('drop function') ||
    formattedQuery.includes('alter function')
  ) {
    return 'functions'
  } else if (
    formattedQuery.includes('create policy') ||
    formattedQuery.includes('alter policy') ||
    formattedQuery.includes('drop policy')
  ) {
    return 'rls-policies'
  } else if (
    formattedQuery.includes('create table') ||
    formattedQuery.includes('alter table') ||
    formattedQuery.includes('drop table')
  ) {
    return 'tables'
  } else if (
    formattedQuery.includes('create trigger') ||
    formattedQuery.includes('alter trigger') ||
    formattedQuery.includes('drop trigger')
  ) {
    return 'triggers'
  } else if (
    formattedQuery.includes('create index') ||
    formattedQuery.includes('drop index') ||
    formattedQuery.includes('alter index')
  ) {
    return 'indexes'
  } else if (
    formattedQuery.includes('create view') ||
    formattedQuery.includes('drop view') ||
    formattedQuery.includes('alter view') ||
    formattedQuery.includes('create materialized view')
  ) {
    return 'views'
  } else if (
    formattedQuery.includes('create schema') ||
    formattedQuery.includes('drop schema') ||
    formattedQuery.includes('alter schema')
  ) {
    return 'schemas'
  }
}

export const getInvalidationKeysFromSQL = (query: string, ref: string, schema: string = 'public') => {
  const type = identifyQueryType(query)
  if (!type) return []

  switch (type) {
    case 'functions':
      return [databaseKeys.databaseFunctions(ref)]
    case 'rls-policies':
      return [databasePoliciesKeys.list(ref)]
    case 'tables':
      return [tableKeys.list(ref, schema, true), tableKeys.list(ref, schema, false)]
    case 'triggers':
      return [databaseTriggerKeys.list(ref)]
    case 'indexes':
      return [databaseIndexesKeys.list(ref, schema)]
    case 'views':
      return [tableKeys.list(ref, schema, true), tableKeys.list(ref, schema, false)]
    case 'schemas':
      return [databaseKeys.schemas(ref)]
    default:
      return []
  }
}

// Check for function calls that aren't in the safe list
/** @deprecated [Joshen] Ideally we move away from this as this isn't a scalable way to deduce */
export const containsUnknownFunction = (query: string) => {
  const normalizedQuery = query.trim().toLowerCase()
  const functionCallRegex = /\w+\s*\(/g
  const functionCalls = normalizedQuery.match(functionCallRegex) || []

  return functionCalls.some((func) => {
    const isReadOnlyFunc = SAFE_FUNCTIONS.some((safeFunc) => func.trim().toLowerCase() === safeFunc)
    return !isReadOnlyFunc
  })
}

/** @deprecated
 * [Joshen] This isn't really a scalable way to reduce this behaviour, we now have support
 * for a readonly connection string which we can use this to run queries, and is a much
 * clearer way to deduce if the query is read only or not
 */
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
  const [, , , ...rest] = pathname.split('/')
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
        'database/indexes': [databaseIndexesKeys.list(ref, schema)],
      } as const
    )[key] ?? []
  )
}

export const onErrorChat = (error: Error) => {
  const parsedError = error ? tryParseJson(error.message) : undefined

  try {
    handleError(parsedError?.error || parsedError || error)
  } catch (e: any) {
    if (e instanceof ResponseError) {
      toast.error(e.message)
    } else if (e instanceof Error) {
      toast.error(e.message)
    } else if (typeof e === 'string') {
      toast.error(e)
    } else {
      toast.error('An unknown error occurred')
    }
  }
}
