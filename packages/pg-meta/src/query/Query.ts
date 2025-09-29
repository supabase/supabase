import { IQueryAction, QueryAction } from './QueryAction'

interface IQuery {
  from: (table: string, schema?: string) => IQueryAction
}

// [Joshen] These reserved keywords need to be wrapped in double quotes
const RESERVED_KEYWORDS = ['system_user']

export class Query implements IQuery {
  /**
   * @param name    the table name.
   * @param schema  the table schema, by default set to 'public'.
   */
  from(name: string, schema?: string) {
    return new QueryAction({
      name: RESERVED_KEYWORDS.includes(name) ? `"${name}"` : name,
      schema: schema ?? 'public',
    })
  }
}
