import { oneLine } from 'common-tags'
import { parseQuery } from 'libpg-query'
import {
  ColumnRef,
  FromExpression,
  ParsedQuery,
  PgString,
  SelectResTarget,
  SelectStmt,
  SortBy,
  Stmt,
  WhereExpression,
} from './types/libpg-query'

export type Statement = Select

export type Select = {
  type: 'select'
  from: string
  targets: Target[]
  filter?: Filter
  sorts?: Sort[]
  limit?: Limit
}

export type Limit = {
  count?: number
  offset?: number
}

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

/**
 * Represents a direct column target in the select.
 */
export type ColumnTarget = {
  type: 'column-target'
  column: string
  alias?: string
  cast?: string
}

export type JoinedColumn = {
  relation: string
  column: string
}

/**
 * Represents a resource embedding (joined) target in the select.
 */
export type EmbeddedTarget = {
  type: 'embedded-target'
  relation: string
  targets: Target[]
  joinType: 'left' | 'inner'
  joinedColumns: {
    left: JoinedColumn
    right: JoinedColumn
  }
  alias?: string
  flatten?: boolean
}

export type Target = ColumnTarget | EmbeddedTarget

export type Sort = {
  column: string
  direction?: 'asc' | 'desc'
  nulls?: 'first' | 'last'
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
    throw new Error('Only one FROM source is supported')
  }

  const [fromClause] = stmt.SelectStmt.fromClause

  const { from, alias, embeddedTargets } = processFromClause(fromClause)

  const targets = processTargetList(stmt.SelectStmt.targetList, alias ?? from, embeddedTargets)

  const filter = stmt.SelectStmt.whereClause
    ? processWhereClause(stmt.SelectStmt.whereClause)
    : undefined

  const sorts = processSortClause(stmt.SelectStmt.sortClause ?? [])

  const limit = processLimit(stmt)

  return {
    type: 'select',
    from,
    targets,
    filter,
    sorts,
    limit,
  }
}

function processFromClause(fromClause: FromExpression): {
  from: string
  alias?: string
  embeddedTargets: EmbeddedTarget[]
} {
  if ('RangeVar' in fromClause) {
    return {
      from: fromClause.RangeVar.relname,
      alias: fromClause.RangeVar.alias?.aliasname,
      embeddedTargets: [],
    }
  } else if ('JoinExpr' in fromClause) {
    const joinType = mapJoinType(fromClause.JoinExpr.jointype)
    const { from, alias, embeddedTargets } = processFromClause(fromClause.JoinExpr.larg)

    const joinedRelationAlias = fromClause.JoinExpr.rarg.RangeVar.alias?.aliasname
    const joinedRelation = joinedRelationAlias ?? fromClause.JoinExpr.rarg.RangeVar.relname

    const existingRelations = [
      alias ?? from,
      ...embeddedTargets.map((t) => t.alias ?? t.relation),
      joinedRelation,
    ]

    if (!('A_Expr' in fromClause.JoinExpr.quals)) {
      throw new Error(`Expected join qualifier to be an expression comparing columns`)
    }

    let leftQualifierRelation
    let rightQualifierRelation

    const joinQualifierExpression = fromClause.JoinExpr.quals.A_Expr

    if (!('ColumnRef' in joinQualifierExpression.lexpr)) {
      throw new Error(`Expected left side of join qualifier to be a column reference`)
    }

    if (
      !joinQualifierExpression.lexpr.ColumnRef.fields.every(
        (field): field is PgString => 'String' in field
      )
    ) {
      throw new Error(`Expected left column reference of join qualifier to contain String fields`)
    }

    const leftColumnFields = joinQualifierExpression.lexpr.ColumnRef.fields.map(
      (field) => field.String.sval
    )

    // Relation and column names are last two parts of the qualified name
    const [leftRelationName] = leftColumnFields.slice(-2, -1)
    const [leftColumnName] = leftColumnFields.slice(-1)

    if (!leftRelationName) {
      leftQualifierRelation = alias ?? from
    } else if (existingRelations.includes(leftRelationName)) {
      leftQualifierRelation = leftRelationName
    } else if (leftRelationName === joinedRelation) {
      leftQualifierRelation = joinedRelation
    } else {
      throw new Error(
        `Left side of join qualifier references a different relation (${leftRelationName}) than the join (${existingRelations.join(', ')})`
      )
    }

    if (!('ColumnRef' in joinQualifierExpression.rexpr)) {
      throw new Error(`Expected right side of join qualifier to be a column reference`)
    }

    if (
      !joinQualifierExpression.rexpr.ColumnRef.fields.every(
        (field): field is PgString => 'String' in field
      )
    ) {
      throw new Error(`Expected right column reference of join qualifier to contain String fields`)
    }

    const rightColumnFields = joinQualifierExpression.rexpr.ColumnRef.fields.map(
      (field) => field.String.sval
    )

    // Relation and column names are last two parts of the qualified name
    const [rightRelationName] = rightColumnFields.slice(-2, -1)
    const [rightColumnName] = rightColumnFields.slice(-1)

    if (!rightRelationName) {
      rightQualifierRelation = alias ?? from
    } else if (existingRelations.includes(rightRelationName)) {
      rightQualifierRelation = rightRelationName
    } else if (rightRelationName === joinedRelation) {
      rightQualifierRelation = joinedRelation
    } else {
      throw new Error(
        `Right side of join qualifier references a different relation (${rightRelationName}) than the join (${existingRelations.join(', ')})`
      )
    }

    if (rightQualifierRelation === leftQualifierRelation) {
      // TODO: support for recursive relationships
      throw new Error(`Join qualifier cannot compare columns from same relation`)
    }

    if (rightQualifierRelation !== joinedRelation && leftQualifierRelation !== joinedRelation) {
      throw new Error(`Join qualifier must reference a column from the joined table`)
    }

    const [qualifierOperatorString] = joinQualifierExpression.name

    if (qualifierOperatorString.String.sval !== '=') {
      throw new Error(`Expected join qualifier operator to be '='`)
    }

    let left: JoinedColumn
    let right: JoinedColumn

    // If left qualifier referenced the joined relation, swap left and right
    if (rightQualifierRelation === joinedRelation) {
      left = {
        relation: leftQualifierRelation,
        column: leftColumnName,
      }
      right = {
        relation: rightQualifierRelation,
        column: rightColumnName,
      }
    } else {
      right = {
        relation: leftQualifierRelation,
        column: leftColumnName,
      }
      left = {
        relation: rightQualifierRelation,
        column: rightColumnName,
      }
    }

    const embeddedTarget: EmbeddedTarget = {
      type: 'embedded-target',
      relation: fromClause.JoinExpr.rarg.RangeVar.relname,
      alias: fromClause.JoinExpr.rarg.RangeVar.alias?.aliasname,
      joinType,
      targets: [], // these will be filled in later when processing the select target list
      flatten: true,
      joinedColumns: {
        left,
        right,
      },
    }

    return {
      from,
      alias,
      embeddedTargets: [...embeddedTargets, embeddedTarget],
    }
  } else {
    const [fieldType] = Object.keys(fromClause)
    throw new Error(`Unsupported FROM clause type '${fieldType}'`)
  }
}

function processTargetList(
  targetList: SelectResTarget[],
  from: string,
  embeddedTargets: EmbeddedTarget[]
): Target[] {
  const flattenedColumnTargets: ColumnTarget[] = targetList.map((resTarget) => {
    let columnRef: ColumnRef
    let cast: string | undefined

    if ('TypeCast' in resTarget.ResTarget.val) {
      cast = resTarget.ResTarget.val.TypeCast.typeName.names
        .map((name) => name.String.sval)
        .join('.')

      columnRef = resTarget.ResTarget.val.TypeCast.arg
    } else if ('ColumnRef' in resTarget.ResTarget.val) {
      columnRef = resTarget.ResTarget.val
    } else {
      throw new Error('Only columns allowed in select targets')
    }

    const { fields } = columnRef.ColumnRef

    const column = fields
      .map((field) => {
        if ('String' in field) {
          return field.String.sval
        } else if ('A_Star' in field) {
          return '*'
        } else {
          const [fieldType] = Object.keys(field)
          throw new Error(`Unsupported ColumnRef field type '${fieldType}'`)
        }
      })
      .join('.')

    const alias = resTarget.ResTarget.name

    return {
      type: 'column-target',
      column,
      alias,
      cast,
    }
  })

  // Transfer resource embedding columns and to `embeddedTargets`
  const columnTargets = flattenedColumnTargets.filter((target) => {
    const qualifiedName = target.column.split('.')

    // Relation and column names are last two parts of the qualified name
    const [relationName] = qualifiedName.slice(-2, -1)
    const [columnName] = qualifiedName.slice(-1)

    if (relationName === from) {
      return true
    }

    if (relationName) {
      const embeddedTarget = embeddedTargets.find(
        (t) => (!t.alias && t.relation === relationName) || t.alias === relationName
      )

      if (!embeddedTarget) {
        throw new Error(
          oneLine`
            Found foreign column '${target.column}' in target list without a join to that relation.
            Did you forget to join that relation or alias it to something else?
          `
        )
      }

      // Strip relation from column name
      target.column = columnName

      embeddedTarget.targets.push(target)
      return false
    }

    return true
  })

  // Nest embedded targets within each other based on the relations in their join qualifiers
  const nestedEmbeddedTargets = embeddedTargets.reduce<EmbeddedTarget[]>(
    (output, embeddedTarget) => {
      // If the embedded target was joined with the primary relation, return it
      if (embeddedTarget.joinedColumns.left.relation === from) {
        return [...output, embeddedTarget]
      }

      // Otherwise identify the correct parent and nest it within its targets
      const parent = embeddedTargets.find(
        (t) => (t.alias ?? t.relation) === embeddedTarget.joinedColumns.left.relation
      )

      if (!parent) {
        throw new Error(
          `Something went wrong, could not find parent embedded target for nested embedded target '${embeddedTarget.relation}'`
        )
      }

      parent.targets.push(embeddedTarget)
      return output
    },
    []
  )

  return [...columnTargets, ...nestedEmbeddedTargets]
}

function processWhereClause(expression: WhereExpression): Filter {
  if ('A_Expr' in expression) {
    if ('TypeCast' in expression.A_Expr.lexpr) {
      throw new Error('Casting is not supported in the WHERE clause')
    }

    if (!('ColumnRef' in expression.A_Expr.lexpr)) {
      throw new Error('Only columns allowed in WHERE clause')
    }

    const { fields } = expression.A_Expr.lexpr.ColumnRef

    const [field] = fields

    if (!('String' in field)) {
      const [fieldType] = Object.keys(field)
      throw new Error(`WHERE clause fields must be String type, received '${fieldType}'`)
    }

    if (expression.A_Expr.name.length > 1) {
      throw new Error('Only one operator name supported per expression')
    }

    const [name] = expression.A_Expr.name
    const operatorSymbol = name.String.sval
    const operator = mapOperatorSymbol(operatorSymbol)

    const stringFields = fields.filter((field): field is PgString => 'String' in field)
    const column = stringFields.map((field) => field.String.sval).join('.')
    let value: any

    if (!('A_Const' in expression.A_Expr.rexpr)) {
      throw new Error(`Expected right side of WHERE clause expression to be a constant`)
    }

    if ('sval' in expression.A_Expr.rexpr.A_Const) {
      value = expression.A_Expr.rexpr.A_Const.sval.sval
    } else if ('ival' in expression.A_Expr.rexpr.A_Const) {
      value = expression.A_Expr.rexpr.A_Const.ival.ival
    } else if ('fval' in expression.A_Expr.rexpr.A_Const) {
      value = parseFloat(expression.A_Expr.rexpr.A_Const.fval.fval)
    } else {
      throw new Error(
        `WHERE clause values must be a string (sval), integer (ival), or float (fval)`
      )
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

    const [field] = fields

    if (!('String' in field)) {
      const [fieldType] = Object.keys(field)
      throw new Error(`WHERE clause fields must be String type, received '${fieldType}'`)
    }

    const stringFields = fields.filter((field): field is PgString => 'String' in field)
    const column = stringFields.map((field) => field.String.sval).join('.')

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

function processSortClause(sorts: SortBy[]): Sort[] {
  return sorts.map((sortBy) => {
    if ('TypeCast' in sortBy.SortBy.node) {
      throw new Error('Casting is not supported in the ORDER BY clause')
    }

    if (!('ColumnRef' in sortBy.SortBy.node)) {
      throw new Error('ORDER BY clause only accepts columns')
    }

    const { fields } = sortBy.SortBy.node.ColumnRef

    const [field] = fields

    if (!('String' in field)) {
      const [fieldType] = Object.keys(field)
      throw new Error(`ORDER BY clause fields must be String type, received '${fieldType}'`)
    }

    const stringFields = fields.filter((field): field is PgString => 'String' in field)
    const column = stringFields.map((field) => field.String.sval).join('.')
    const direction = mapSortByDirection(sortBy.SortBy.sortby_dir)
    const nulls = mapSortByNulls(sortBy.SortBy.sortby_nulls)

    return {
      column,
      direction,
      nulls,
    }
  })
}

function mapSortByDirection(direction: string) {
  switch (direction) {
    case 'SORTBY_ASC':
      return 'asc'
    case 'SORTBY_DESC':
      return 'desc'
    case 'SORTBY_DEFAULT':
      return undefined
    default:
      throw new Error(`Unknown sort by direction '${direction}'`)
  }
}

function mapSortByNulls(nulls: string) {
  switch (nulls) {
    case 'SORTBY_NULLS_FIRST':
      return 'first'
    case 'SORTBY_NULLS_LAST':
      return 'last'
    case 'SORTBY_NULLS_DEFAULT':
      return undefined
    default:
      throw new Error(`Unknown sort by nulls '${nulls}'`)
  }
}

function processLimit(selectStmt: SelectStmt): Limit | undefined {
  let count: number | undefined = undefined
  let offset: number | undefined = undefined

  if (selectStmt.SelectStmt.limitCount) {
    if (!('ival' in selectStmt.SelectStmt.limitCount.A_Const)) {
      throw new Error(`Limit count expected to be an integer`)
    }

    count = selectStmt.SelectStmt.limitCount.A_Const.ival.ival
  }

  if (selectStmt.SelectStmt.limitOffset) {
    if (!('ival' in selectStmt.SelectStmt.limitOffset.A_Const)) {
      throw new Error(`Limit offset expected to be an integer`)
    }

    offset = selectStmt.SelectStmt.limitOffset.A_Const.ival.ival
  }

  if (count === undefined && offset === undefined) {
    return undefined
  }

  return {
    count,
    offset,
  }
}

function mapJoinType(joinType: string) {
  switch (joinType) {
    case 'JOIN_INNER':
      return 'inner'
    case 'JOIN_LEFT':
      return 'left'
    default:
      throw new Error(`Unsupported join type '${joinType}'`)
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
