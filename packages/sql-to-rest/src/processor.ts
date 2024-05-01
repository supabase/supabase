import { parseQuery } from '@gregnr/libpg-query'
import {
  ParsedQuery,
  SelectResTarget,
  SelectStmt,
  Stmt,
  WhereClauseExpression,
} from './types/pg-query'

export type Statement = Select

export type Select = {
  type: 'select'
  from: string
  targets: Target[]
  filter?: Filter
}

export type Operator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is'
export type LogicalOperator = 'and' | 'or'

export type BaseFilter = {
  negate: boolean
}

export type BaseColumnFilter = BaseFilter & {
  type: 'column'
  column: string
}

export type EqColumnFilter = BaseColumnFilter & {
  operator: 'eq'
  value: string | number
}

export type NeqColumnFilter = BaseColumnFilter & {
  operator: 'neq'
  value: string | number
}

export type GtColumnFilter = BaseColumnFilter & {
  operator: 'gt'
  value: number
}

export type GteColumnFilter = BaseColumnFilter & {
  operator: 'gte'
  value: number
}

export type LtColumnFilter = BaseColumnFilter & {
  operator: 'lt'
  value: number
}

export type LteColumnFilter = BaseColumnFilter & {
  operator: 'lte'
  value: number
}

export type LikeColumnFilter = BaseColumnFilter & {
  operator: 'like'
  value: string
}

export type IlikeColumnFilter = BaseColumnFilter & {
  operator: 'ilike'
  value: string
}

export type IsColumnFilter = BaseColumnFilter & {
  operator: 'is'
  value: null
}

export type ColumnFilter =
  | EqColumnFilter
  | NeqColumnFilter
  | GtColumnFilter
  | GteColumnFilter
  | LtColumnFilter
  | LteColumnFilter
  | LikeColumnFilter
  | IlikeColumnFilter
  | IsColumnFilter

export type LogicalFilter = BaseFilter & {
  type: 'logical'
  operator: LogicalOperator
  values: Filter[]
}

export type Filter = ColumnFilter | LogicalFilter

export type Target = {
  type: 'target'
  column: string
  alias?: string
}

/**
 * Coverts SQL into a PostgREST-compatible `Statement`.
 *
 * Expects SQL to contain only one statement.
 *
 * @returns An intermediate `Statement` object that
 * can be rendered to various targets (HTTP, supabase-js, etc).
 */
export async function processSql(sql: string) {
  const result: ParsedQuery = await parseQuery(sql)

  console.dir(result, { depth: null })

  if (result.stmts.length === 0) {
    throw new Error('Expected a statement, but received none')
  }

  if (result.stmts.length > 1) {
    throw new Error('Expected a single statement, but received multiple')
  }

  const [statement] = result.stmts.map((stmt) => processStmt(stmt))

  return statement
}

/**
 * Converts a pg-query `Stmt` into a PostgREST-compatible `Statement`.
 */
function processStmt({ stmt }: Stmt): Statement {
  const keys = Object.keys(stmt) as unknown as (keyof typeof stmt)[]

  if (keys.length > 1) {
    throw new Error(`stmt contains multiple statements: ${JSON.stringify(keys)}`)
  }

  const [stmtType] = keys

  switch (stmtType) {
    case 'SelectStmt':
      return processSelectStmt(stmt)
    default:
      throw new Error(`Unsupported stmt type '${stmtType}'`)
  }
}

function processSelectStmt(stmt: SelectStmt): Select {
  if (!stmt.SelectStmt.fromClause) {
    throw new Error('A relation must be included in a from clause')
  }

  if (stmt.SelectStmt.fromClause.length > 1) {
    throw new Error('Only one relation supported in from clause')
  }

  const [rangeVar] = stmt.SelectStmt.fromClause

  const from = rangeVar.RangeVar.relname

  const targets = processTargetList(stmt.SelectStmt.targetList)

  const filter = stmt.SelectStmt.whereClause
    ? processWhereClause(stmt.SelectStmt.whereClause)
    : undefined

  return {
    type: 'select',
    from,
    targets,
    filter,
  }
}

function processTargetList(targetList: SelectResTarget[]): Target[] {
  return targetList.map((resTarget) => {
    if (!('ColumnRef' in resTarget.ResTarget.val)) {
      throw new Error('Only columns allowed in select targets')
    }

    const { fields } = resTarget.ResTarget.val.ColumnRef

    if (fields.length > 1) {
      throw new Error('Only one field supported per column')
    }

    const [field] = fields

    let column: string

    if ('A_Star' in field) {
      column = '*'
    } else if ('String' in field) {
      column = field.String.str
    } else {
      const [fieldType] = Object.keys(field)
      throw new Error(`Unsupported ColumnRef field type '${fieldType}'`)
    }

    const alias = resTarget.ResTarget.name

    return {
      type: 'target',
      column,
      alias,
    }
  })
}

function processWhereClause(expression: WhereClauseExpression): Filter {
  if ('A_Expr' in expression) {
    const { fields } = expression.A_Expr.lexpr.ColumnRef

    if (fields.length > 1) {
      throw new Error('Only one field supported per column')
    }

    const [field] = fields

    if (!('String' in field)) {
      const [fieldType] = Object.keys(field)
      throw new Error(`WHERE clause fields must be String type, received '${fieldType}'`)
    }

    if (expression.A_Expr.name.length > 1) {
      throw new Error('Only one operator name supported per expression')
    }

    const [name] = expression.A_Expr.name
    const operatorSymbol = name.String.str
    const operator = mapOperatorSymbol(operatorSymbol)

    const column = field.String.str
    let value: any

    if ('String' in expression.A_Expr.rexpr.A_Const.val) {
      value = expression.A_Expr.rexpr.A_Const.val.String.str
    } else if ('Integer' in expression.A_Expr.rexpr.A_Const.val) {
      value = expression.A_Expr.rexpr.A_Const.val.Integer.ival
    } else {
      const [valType] = Object.keys(expression.A_Expr.rexpr.A_Const.val)
      throw new Error(`WHERE clause values must be String or Integer types, received '${valType}'`)
    }

    return {
      type: 'column',
      column,
      operator,
      negate: false,
      value,
    }
  } else if ('NullTest' in expression) {
    const { fields } = expression.NullTest.arg.ColumnRef

    if (fields.length > 1) {
      throw new Error('Only one field supported per column')
    }

    const [field] = fields

    if (!('String' in field)) {
      const [fieldType] = Object.keys(field)
      throw new Error(`WHERE clause fields must be String type, received '${fieldType}'`)
    }

    const column = field.String.str

    const negate = expression.NullTest.nulltesttype === 'IS_NOT_NULL'
    const operator = 'is'
    const value = null

    return {
      type: 'column',
      column,
      operator,
      negate,
      value,
    }
  } else if ('BoolExpr' in expression) {
    let operator: 'and' | 'or' | 'not'

    if (expression.BoolExpr.boolop === 'AND_EXPR') {
      operator = 'and'
    } else if (expression.BoolExpr.boolop === 'OR_EXPR') {
      operator = 'or'
    } else if (expression.BoolExpr.boolop === 'NOT_EXPR') {
      operator = 'not'
    } else {
      throw new Error(`Unknown boolop '${expression.BoolExpr.boolop}'`)
    }

    const values = expression.BoolExpr.args.map((arg) => processWhereClause(arg))

    // The 'not' operator is special - instead of wrapping its child,
    // we just return the child directly and set negate=true on it.
    if (operator === 'not') {
      if (values.length > 1) {
        throw new Error(
          `NOT expressions expected to have only 1 child. Received ${values.length} children`
        )
      }
      const [filter] = values
      filter.negate = true
      return filter
    }

    return {
      type: 'logical',
      operator,
      negate: false,
      values,
    }
  } else {
    const [expressionType] = Object.keys(expression)
    throw new Error(`Unknown WHERE clause expression '${expressionType}'`)
  }
}

function mapOperatorSymbol(operatorSymbol: string) {
  switch (operatorSymbol) {
    case '=':
      return 'eq'
    case '<>':
      return 'neq'
    case '>':
      return 'gt'
    case '>=':
      return 'gte'
    case '<':
      return 'lt'
    case '<=':
      return 'lte'
    case '~~':
      return 'like'
    case '~~*':
      return 'ilike'
    default:
      throw new Error(`Unsupported operator symbol '${operatorSymbol}'`)
  }
}
