import { Dictionary, Filter, FilterOperator, QueryTable, Sort } from '../types';
import { IQueryModifier, QueryModifier } from './QueryModifier';

export interface IQueryFilter {
  filter: (
    column: string,
    operator: FilterOperator,
    value: string
  ) => IQueryFilter;
  match: (criteria: Dictionary<any>) => IQueryFilter;
  order: (
    column: string,
    ascending?: boolean,
    nullsFirst?: boolean
  ) => IQueryFilter;
}

export class QueryFilter implements IQueryFilter, IQueryModifier {
  protected filters: Filter[] = [];
  protected sorts: Sort[] = [];

  constructor(
    protected table: QueryTable,
    protected action: 'count' | 'delete' | 'insert' | 'select' | 'update',
    protected actionValue?: string[] | Dictionary<any> | Dictionary<any>[],
    protected actionOptions?: { returning: boolean }
  ) {}

  filter(column: string, operator: FilterOperator, value: any) {
    this.filters.push({ column, operator, value });
    return this;
  }

  match(criteria: Dictionary<any>) {
    Object.entries(criteria).map(([column, value]) => {
      this.filters.push({ column, operator: '=', value });
    });
    return this;
  }

  order(column: string, ascending = true, nullsFirst = false) {
    this.sorts.push({
      column: column,
      ascending,
      nullsFirst,
    });
    return this;
  }

  range(from: number, to: number) {
    return this._getQueryModifier().range(from, to);
  }

  toSql() {
    return this._getQueryModifier().toSql();
  }

  _getQueryModifier() {
    return new QueryModifier(this.table, this.action, {
      actionValue: this.actionValue,
      actionOptions: this.actionOptions,
      filters: this.filters,
      sorts: this.sorts,
    });
  }
}
