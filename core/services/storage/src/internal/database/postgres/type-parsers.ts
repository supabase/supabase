import { types as defaultTypes } from 'pg'

const INT8_OID = 20

export type PostgresTypeParserRegistry = Pick<typeof defaultTypes, 'setTypeParser'>

export function installPostgresTypeParsers(
  registry: PostgresTypeParserRegistry = defaultTypes
): void {
  registry.setTypeParser(INT8_OID, 'text', parseInt)
}
