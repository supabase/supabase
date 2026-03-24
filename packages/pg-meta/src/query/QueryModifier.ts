import {
  countQuery,
  deleteQuery,
  insertQuery,
  selectQuery,
  truncateQuery,
  updateQuery,
} from './Query.utils'
import type { Dictionary, Filter, QueryPagination, QueryTable, Sort } from './types'

export interface IQueryModifier {
  range: (from: number, to: number) => QueryModifier
  toSql: () => string
}

export class QueryModifier implements IQueryModifier {
  protected pagination?: QueryPagination

  constructor(
    protected table: QueryTable,
    protected action: 'count' | 'delete' | 'insert' | 'select' | 'update' | 'truncate',
    protected options?: {
      actionValue?: string | string[] | Dictionary<any> | Dictionary<any>[]
      actionOptions?: { returning?: boolean; cascade?: boolean; enumArrayColumns?: string[] }
      filters?: Filter[]
      sorts?: Sort[]
    }
  ) {}

  /**
   * Limits the result to rows within the specified range, inclusive.
   *
   * @param from  The starting index from which to limit the result, inclusive.
   * @param to  The last index to which to limit the result, inclusive.
   */
  range(from: number, to: number) {
    this.pagination = { offset: from, limit: to - from + 1 }
    return this
  }

  /**
   * Return SQL string for query chains
   */
  toSql(options: { isCTE: boolean; isFinal: boolean } = { isCTE: false, isFinal: true }) {
    try {
      const { actionValue, actionOptions, filters, sorts } = this.options ?? {}
      switch (this.action) {
        case 'count': {
          return countQuery(this.table, { filters })
        }
        case 'delete': {
          return deleteQuery(this.table, filters, {
            returning: actionOptions?.returning,
            enumArrayColumns: actionOptions?.enumArrayColumns,
          })
        }
        case 'insert': {
          return insertQuery(this.table, actionValue as Dictionary<any>[], {
            returning: actionOptions?.returning,
            enumArrayColumns: actionOptions?.enumArrayColumns,
          })
        }
        case 'select': {
          return selectQuery(
            this.table,
            actionValue as string | undefined,
            {
              filters,
              pagination: this.pagination,
              sorts,
            },
            options.isFinal,
            options.isCTE
          )
        }
        case 'update': {
          return updateQuery(this.table, actionValue as Dictionary<any>, {
            filters,
            returning: actionOptions?.returning,
            enumArrayColumns: actionOptions?.enumArrayColumns,
          })
        }
        case 'truncate': {
          return truncateQuery(this.table, {
            cascade: actionOptions?.cascade,
          })
        }
        default: {
          return ''
        }
      }
    } catch (error) {
      throw error
    }
  }
}
