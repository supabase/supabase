import { IQueryModifier, QueryModifier } from './QueryModifier'
import type { Dictionary, Filter, FilterOperator, QueryTable, Sort } from './types'

export interface IQueryFilter {
  filter: (column: string, operator: FilterOperator, value: string) => IQueryFilter
  match: (criteria: Dictionary<any>) => IQueryFilter
  order: (table: string, column: string, ascending?: boolean, nullsFirst?: boolean) => IQueryFilter
}

export class QueryFilter implements IQueryFilter, IQueryModifier {
  protected filters: Filter[] = []
  protected sorts: Sort[] = []

  constructor(
    protected table: QueryTable,
    protected action: 'count' | 'delete' | 'insert' | 'select' | 'update' | 'truncate',
    protected actionValue?: string | string[] | Dictionary<any> | Dictionary<any>[],
    protected actionOptions?: { returning: boolean; enumArrayColumns?: string[] }
  ) {}

  filter(column: string | string[], operator: FilterOperator, value: any) {
    this.filters.push({ column, operator, value })
    return this
  }

  match(criteria: Dictionary<any>) {
    Object.entries(criteria).map(([column, value]) => {
      this.filters.push({ column, operator: '=', value })
    })
    return this
  }

  order(table: string, column: string, ascending = true, nullsFirst = false) {
    this.sorts.push({
      table: table,
      column: column,
      ascending,
      nullsFirst,
    })
    return this
  }

  range(from: number, to: number) {
    return this._getQueryModifier().range(from, to)
  }

  clone(): QueryFilter {
    const cloned = new QueryFilter(
      { ...this.table },
      this.action,
      Array.isArray(this.actionValue)
        ? this.actionValue.map((val) => (typeof val === 'object' ? { ...val } : val))
        : !!this.actionValue && typeof this.actionValue === 'object'
          ? { ...this.actionValue }
          : this.actionValue,
      this.actionOptions ? { ...this.actionOptions } : undefined
    )
    cloned.filters = this.filters.slice()
    cloned.sorts = this.sorts.slice()
    return cloned
  }

  toSql(options?: { isCTE: boolean; isFinal: boolean }) {
    return this._getQueryModifier().toSql(options)
  }

  _getQueryModifier() {
    return new QueryModifier(this.table, this.action, {
      actionValue: this.actionValue,
      actionOptions: this.actionOptions,
      filters: this.filters,
      sorts: this.sorts,
    })
  }
}
