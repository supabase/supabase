import { ident } from '@supabase/pg-meta/src/pg-format'

export function getFunctionGrantSql({
  functionSchema,
  functionName,
  functionArgs,
  role,
}: {
  functionSchema: string
  functionName: string
  functionArgs: string
  role: string
}) {
  const functionRef = `${ident(functionSchema)}.${ident(functionName)}(${functionArgs})`
  return `GRANT EXECUTE ON FUNCTION ${functionRef} TO ${ident(role)};`
}

export function getFunctionRevokeSql({
  functionSchema,
  functionName,
  functionArgs,
  role,
}: {
  functionSchema: string
  functionName: string
  functionArgs: string
  role: string
}) {
  const functionRef = `${ident(functionSchema)}.${ident(functionName)}(${functionArgs})`
  return `REVOKE EXECUTE ON FUNCTION ${functionRef} FROM ${ident(role)};`
}
