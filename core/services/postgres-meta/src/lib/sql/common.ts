export type SQLQueryProps = {
  limit?: number
  offset?: number
}

export type SQLQueryPropsWithSchemaFilter = SQLQueryProps & {
  schemaFilter?: string
}

export type SQLQueryPropsWithIdsFilter = SQLQueryProps & {
  idsFilter?: string
}

export type SQLQueryPropsWithSchemaFilterAndIdsFilter = SQLQueryProps & {
  schemaFilter?: string
  idsFilter?: string
}
