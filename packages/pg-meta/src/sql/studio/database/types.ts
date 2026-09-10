import { ident, joinSqlFragments, literal, safeSql, type SafeSqlFragment } from '../../../pg-format'
import { wrapWithTransaction } from '../../../query'

export const getCreateEnumeratedTypeSQL = ({
  schema,
  name,
  values,
  description,
}: {
  schema: string
  name: string
  values: string[]
  description?: string
}) => {
  const typeSql = safeSql`${ident(schema)}.${ident(name)}`
  const createSql = safeSql`create type ${typeSql} as enum (${joinSqlFragments(values.map(literal), ', ')});`
  const commentSql =
    description !== undefined
      ? safeSql`comment on type ${typeSql} is ${literal(description)};`
      : safeSql``
  return wrapWithTransaction(safeSql`${createSql} ${commentSql}`)
}

export const getDeleteEnumeratedTypeSQL = ({ schema, name }: { schema: string; name: string }) => {
  return safeSql`drop type if exists ${ident(schema)}.${ident(name)}`
}

export const getUpdateEnumeratedTypeSQL = ({
  schema,
  name,
  description,
  values = [],
}: {
  schema: string
  name: { original: string; updated: string }
  description?: string
  values?: { original: string; updated: string; isNew: boolean }[]
}) => {
  const statements: SafeSqlFragment[] = []
  const typeSql = safeSql`${ident(schema)}.${ident(name.updated)}`

  if (name.original !== name.updated) {
    statements.push(
      safeSql`alter type ${ident(schema)}.${ident(name.original)} rename to ${ident(name.updated)};`
    )
  }

  if (values.length > 0) {
    values.forEach((x, idx) => {
      if (x.isNew) {
        if (idx === 0) {
          // Consider if any new enums were added before any existing enums
          const firstExistingEnumValue = values.find((x) => !x.isNew)
          statements.push(
            safeSql`alter type ${typeSql} add value ${literal(x.updated)} before ${literal(firstExistingEnumValue?.original)};`
          )
        } else {
          statements.push(
            safeSql`alter type ${typeSql} add value ${literal(x.updated)} after ${literal(values[idx - 1].updated)};`
          )
        }
      } else if (x.original !== x.updated) {
        statements.push(
          safeSql`alter type ${typeSql} rename value ${literal(x.original)} to ${literal(x.updated)};`
        )
      }
    })
  }
  if (description !== undefined) {
    statements.push(safeSql`comment on type ${typeSql} is ${literal(description)};`)
  }

  return wrapWithTransaction(joinSqlFragments(statements, ' '))
}
