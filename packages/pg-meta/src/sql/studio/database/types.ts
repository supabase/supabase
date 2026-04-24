import { ident, literal } from '../../../pg-format'
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
  const typeSql = `${ident(schema)}.${ident(name)}`
  const createSql = `create type ${typeSql} as enum (${values.map(literal).join(', ')});`
  const commentSql =
    description !== undefined ? `comment on type ${typeSql} is ${literal(description)};` : ''
  return wrapWithTransaction(`${createSql} ${commentSql}`)
}

export const getDeleteEnumeratedTypeSQL = ({ schema, name }: { schema: string; name: string }) => {
  return `drop type if exists ${ident(schema)}.${ident(name)}`
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
  const statements: string[] = []
  const typeSql = `${ident(schema)}.${ident(name.updated)}`

  if (name.original !== name.updated) {
    statements.push(
      `alter type ${ident(schema)}.${ident(name.original)} rename to ${ident(name.updated)};`
    )
  }

  if (values.length > 0) {
    values.forEach((x, idx) => {
      if (x.isNew) {
        if (idx === 0) {
          // Consider if any new enums were added before any existing enums
          const firstExistingEnumValue = values.find((x) => !x.isNew)
          statements.push(
            `alter type ${typeSql} add value ${literal(x.updated)} before ${literal(firstExistingEnumValue?.original)};`
          )
        } else {
          statements.push(
            `alter type ${typeSql} add value ${literal(x.updated)} after ${literal(values[idx - 1].updated)};`
          )
        }
      } else if (x.original !== x.updated) {
        statements.push(
          `alter type ${typeSql} rename value ${literal(x.original)} to ${literal(x.updated)};`
        )
      }
    })
  }
  if (description !== undefined) {
    statements.push(`comment on type ${typeSql} is ${literal(description)};`)
  }

  return wrapWithTransaction(statements.join(' '))
}
