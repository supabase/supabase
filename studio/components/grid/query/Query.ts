import { IQueryAction, QueryAction } from './QueryAction'

interface IQuery {
  from: (table: string, schema?: string) => IQueryAction
}

export class Query implements IQuery {
  /**
   * @param name    the table name.
   * @param schema  the table schema, by default set to 'public'.
   */
  from(name: string, schema?: string) {
    return new QueryAction({
      name,
      schema: schema ?? 'public',
    })
  }
}
