import { parseQuery } from 'libpg-query'
import { ParsingError, UnimplementedError, UnsupportedError } from './errors'
import {
  A_Const,
  A_Expr,
  ColumnRef,
  Field,
  FromExpression,
  FuncCall,
  ParsedQuery,
  PgString,
  SelectResTarget,
  SelectStmt,
  SortBy,
  Stmt,
  TypeCast,
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
  value: string | number
}

export type GteColumnFilter = BaseColumnFilter & {
  operator: 'gte'
  value: string | number
}

export type LtColumnFilter = BaseColumnFilter & {
  operator: 'lt'
  value: string | number
}

export type LteColumnFilter = BaseColumnFilter & {
  operator: 'lte'
  value: string | number
}

export type LikeColumnFilter = BaseColumnFilter & {
  operator: 'like'
  value: string
}

export type IlikeColumnFilter = BaseColumnFilter & {
  operator: 'ilike'
  value: string
}

export type MatchColumnFilter = BaseColumnFilter & {
  operator: 'match'
  value: string
}

export type ImatchColumnFilter = BaseColumnFilter & {
  operator: 'imatch'
  value: string
}

export type IsColumnFilter = BaseColumnFilter & {
  operator: 'is'
  value: null
}

export type InColumnFilter = BaseColumnFilter & {
  operator: 'in'
  value: (string | number)[]
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
  | MatchColumnFilter
  | ImatchColumnFilter
  | IsColumnFilter
  | InColumnFilter

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

export type BaseAggregateTarget = {
  type: 'aggregate-target'
  alias?: string
  outputCast?: string
}

export type ColumnAggregateTarget = BaseAggregateTarget & {
  functionName: string
  column: string
  inputCast?: string
}

/**
 * Special case `count()` aggregate target that works
 * with no column attached.
 */
export type CountAggregateTarget = BaseAggregateTarget & {
  type: 'aggregate-target'
  functionName: 'count'
}

/**
 * Represents a aggregate target in the select.
 */
export type AggregateTarget = CountAggregateTarget | ColumnAggregateTarget

export type Target = ColumnTarget | AggregateTarget | EmbeddedTarget

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
  try {
    const result: ParsedQuery = await parseQuery(sql)

    if (result.stmts.length === 0) {
      throw new UnsupportedError('Expected a statement, but received none')
    }

    if (result.stmts.length > 1) {
      throw new UnsupportedError('Expected a single statement, but received multiple')
    }

    const [statement] = result.stmts.map((stmt) => processStmt(stmt))

    return statement
  } catch (err) {
    if (err instanceof Error && 'cursorPosition' in err) {
      const hint = getParsingErrorHint(err.message)
      const parsingError = new ParsingError(err.message, hint)

      Object.assign(parsingError, err)
      throw parsingError
    } else {
      throw err
    }
  }
}

/**
 * Returns hints for common parsing errors.
 */
function getParsingErrorHint(message: string) {
  switch (message) {
    case 'syntax error at or near "from"':
      return 'Did you leave a trailing comma in the select target list?'
    case 'syntax error at or near "where"':
      return 'Do you have an incomplete join in the FROM clause?'
    default:
      undefined
  }
}

/**
 * Converts a pg-query `Stmt` into a PostgREST-compatible `Statement`.
 */
function processStmt({ stmt }: Stmt): Statement {
  if ('SelectStmt' in stmt) {
    return processSelectStmt(stmt)
  } else if ('InsertStmt' in stmt) {
    throw new UnimplementedError(`Insert statements are not yet implemented by the translator`)
  } else if ('UpdateStmt' in stmt) {
    throw new UnimplementedError(`Update statements are not yet implemented by the translator`)
  } else if ('DeleteStmt' in stmt) {
    throw new UnimplementedError(`Delete statements are not yet implemented by the translator`)
  } else if ('ExplainStmt' in stmt) {
    throw new UnimplementedError(`Explain statements are not yet implemented by the translator`)
  } else {
    const [stmtType] = Object.keys(stmt)
    const statementType = stmtType.replace(/Stmt$/, '')
    throw new UnsupportedError(`${statementType} statements are not supported`)
  }
}

function processSelectStmt(stmt: SelectStmt): Select {
  if (!stmt.SelectStmt.fromClause) {
    throw new UnsupportedError('The query must have a from clause')
  }

  if (stmt.SelectStmt.fromClause.length > 1) {
    throw new UnsupportedError('Only one FROM source is supported')
  }

  if (stmt.SelectStmt.withClause) {
    throw new UnsupportedError('CTEs are not supported')
  }

  if (stmt.SelectStmt.havingClause) {
    throw new UnsupportedError('The HAVING clause is not supported')
  }

  const [fromClause] = stmt.SelectStmt.fromClause

  const { from, alias, embeddedTargets } = processFromClause(fromClause)

  const targets = processTargetList(stmt.SelectStmt.targetList, alias ?? from, embeddedTargets)

  validateGroupClause(stmt.SelectStmt.groupClause ?? [], targets, alias ?? from)

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
      throw new UnsupportedError(`Join qualifier must be an expression comparing columns`)
    }

    let leftQualifierRelation
    let rightQualifierRelation

    const joinQualifierExpression = fromClause.JoinExpr.quals.A_Expr

    if (!('ColumnRef' in joinQualifierExpression.lexpr)) {
      throw new UnsupportedError(`Left side of join qualifier must be a column`)
    }

    if (
      !joinQualifierExpression.lexpr.ColumnRef.fields.every(
        (field): field is PgString => 'String' in field
      )
    ) {
      throw new UnsupportedError(`Left side column of join qualifier must contain String fields`)
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
      throw new UnsupportedError(
        `Left side of join qualifier references a different relation (${leftRelationName}) than the join (${existingRelations.join(', ')})`
      )
    }

    if (!('ColumnRef' in joinQualifierExpression.rexpr)) {
      throw new UnsupportedError(`Right side of join qualifier must be a column`)
    }

    if (
      !joinQualifierExpression.rexpr.ColumnRef.fields.every(
        (field): field is PgString => 'String' in field
      )
    ) {
      throw new UnsupportedError(`Right side column of join qualifier must contain String fields`)
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
      throw new UnsupportedError(
        `Right side of join qualifier references a different relation (${rightRelationName}) than the join (${existingRelations.join(', ')})`
      )
    }

    if (rightQualifierRelation === leftQualifierRelation) {
      // TODO: support for recursive relationships
      throw new UnsupportedError(`Join qualifier cannot compare columns from same relation`)
    }

    if (rightQualifierRelation !== joinedRelation && leftQualifierRelation !== joinedRelation) {
      throw new UnsupportedError(`Join qualifier must reference a column from the joined table`)
    }

    const [qualifierOperatorString] = joinQualifierExpression.name

    if (qualifierOperatorString.String.sval !== '=') {
      throw new UnsupportedError(`Join qualifier operator must be '='`)
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
    throw new UnsupportedError(`Unsupported FROM clause type '${fieldType}'`)
  }
}

function processTargetList(
  targetList: SelectResTarget[],
  from: string,
  embeddedTargets: EmbeddedTarget[]
): Target[] {
  const flattenedColumnTargets: (ColumnTarget | AggregateTarget)[] = targetList.map((resTarget) => {
    const target = processQueryTarget(resTarget.ResTarget.val)
    target.alias = resTarget.ResTarget.name

    return target
  })

  // Transfer resource embedding columns to `embeddedTargets`
  const columnTargets = flattenedColumnTargets.filter((target) => {
    // Account for the special case when the aggregate doesn't have a column attached
    // ie. `count()`: should always be applied to the top level relation
    if (target.type === 'aggregate-target' && !('column' in target)) {
      return true
    }

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
        throw new UnsupportedError(
          `Found foreign column '${target.column}' in target list without a join to that relation`,
          'Did you forget to join that relation or alias it to something else?'
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
        throw new UnsupportedError(
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

function processQueryTarget(
  queryTarget: TypeCast | ColumnRef | FuncCall | A_Expr
): ColumnTarget | AggregateTarget {
  if ('TypeCast' in queryTarget) {
    const cast = renderDataType(queryTarget.TypeCast.typeName.names)

    if ('A_Const' in queryTarget.TypeCast.arg) {
      throw new UnsupportedError(
        'Only columns, JSON fields, and aggregates are supported as query targets'
      )
    }

    const nestedTarget = processQueryTarget(queryTarget.TypeCast.arg)

    const { type } = nestedTarget

    if (type === 'aggregate-target') {
      return {
        ...nestedTarget,
        outputCast: cast,
      }
    } else if (type === 'column-target') {
      return {
        ...nestedTarget,
        cast,
      }
    } else {
      throw new UnsupportedError(`Cannot process target with type '${type}'`)
    }
  } else if ('ColumnRef' in queryTarget) {
    return {
      type: 'column-target',
      column: renderFields(queryTarget.ColumnRef.fields),
    }
  } else if ('A_Expr' in queryTarget) {
    try {
      return processJsonTarget(queryTarget)
    } catch (err) {
      const maybeJsonHint =
        err instanceof Error && err.message === 'Invalid JSON path'
          ? 'Did you forget to quote a JSON path?'
          : undefined
      throw new UnsupportedError(`Expressions not supported as targets`, maybeJsonHint)
    }
  } else if ('FuncCall' in queryTarget) {
    const functionName = renderFields(queryTarget.FuncCall.funcname)
    const supportedAggregateFunctions = ['avg', 'count', 'max', 'min', 'sum']

    if (!supportedAggregateFunctions.includes(functionName)) {
      throw new UnsupportedError(
        `Only the following aggregate functions are supported: ${JSON.stringify(supportedAggregateFunctions)}`
      )
    }

    // The `count(*)` special case that has no columns attached
    if (functionName === 'count' && !queryTarget.FuncCall.args && queryTarget.FuncCall.agg_star) {
      return {
        type: 'aggregate-target',
        functionName,
      }
    }

    if (!queryTarget.FuncCall.args) {
      throw new UnsupportedError(`Aggregate function '${functionName}' requires a column argument`)
    }

    if (queryTarget.FuncCall.args && queryTarget.FuncCall.args.length > 1) {
      throw new UnsupportedError(`Aggregate functions only accept one argument`)
    }

    const [arg] = queryTarget.FuncCall.args

    const nestedTarget = processQueryTarget(arg)

    if (nestedTarget.type === 'aggregate-target') {
      throw new UnsupportedError(`Aggregate functions cannot contain another function`)
    }

    const { cast, ...columnTarget } = nestedTarget

    return {
      ...columnTarget,
      type: 'aggregate-target',
      functionName,
      inputCast: cast,
    }
  } else {
    throw new UnsupportedError(
      'Only columns, JSON fields, and aggregates are supported as query targets'
    )
  }
}

function processWhereClause(expression: WhereExpression): Filter {
  if ('A_Expr' in expression) {
    if ('TypeCast' in expression.A_Expr.lexpr) {
      throw new UnsupportedError('Casting is not supported in the WHERE clause')
    }

    let column: string

    if ('A_Expr' in expression.A_Expr.lexpr) {
      try {
        const target = processJsonTarget(expression.A_Expr.lexpr)
        column = target.column
      } catch (err) {
        throw new UnsupportedError(`Left side of WHERE clause must be a column`)
      }
    } else if ('ColumnRef' in expression.A_Expr.lexpr) {
      const { fields } = expression.A_Expr.lexpr.ColumnRef

      const [field] = fields

      if (!('String' in field)) {
        const [fieldType] = Object.keys(field)
        throw new UnsupportedError(
          `WHERE clause fields must be String type, received '${fieldType}'`
        )
      }

      if (expression.A_Expr.name.length > 1) {
        throw new UnsupportedError('Only one operator name supported per expression')
      }

      const stringFields = fields.filter((field): field is PgString => 'String' in field)
      column = stringFields.map((field) => field.String.sval).join('.')
    } else {
      throw new UnsupportedError(`Left side of WHERE clause must be a column`)
    }

    const kind = expression.A_Expr.kind
    const [name] = expression.A_Expr.name
    const operatorSymbol = name.String.sval
    const operator = mapOperatorSymbol(kind, operatorSymbol)

    if (
      operator === 'eq' ||
      operator === 'neq' ||
      operator === 'gt' ||
      operator === 'gte' ||
      operator === 'lt' ||
      operator === 'lte'
    ) {
      if (!('A_Const' in expression.A_Expr.rexpr)) {
        throw new UnsupportedError(
          `Right side of WHERE clause '${operatorSymbol}' expression must be a constant`,
          `Did you forget to wrap your value in single quotes?`
        )
      }

      const value = parseConstant(expression.A_Expr.rexpr)
      return {
        type: 'column',
        column,
        operator,
        negate: false,
        value,
      }
    } else if (
      operator === 'like' ||
      operator === 'ilike' ||
      operator === 'match' ||
      operator === 'imatch'
    ) {
      if (!('A_Const' in expression.A_Expr.rexpr) || !('sval' in expression.A_Expr.rexpr.A_Const)) {
        throw new UnsupportedError(
          `Right side of WHERE clause '${operator}' expression must be a string constant`
        )
      }

      const value = expression.A_Expr.rexpr.A_Const.sval.sval

      return {
        type: 'column',
        column,
        operator,
        negate: false,
        value,
      }
    } else if (operator === 'in') {
      if (
        !('List' in expression.A_Expr.rexpr) ||
        !expression.A_Expr.rexpr.List.items.every((item) => 'A_Const' in item)
      ) {
        throw new UnsupportedError(
          `Right side of WHERE clause '${operator}' expression must be a list of constants`
        )
      }

      const value = expression.A_Expr.rexpr.List.items.map((item) => parseConstant(item))

      return {
        type: 'column',
        column,
        operator,
        negate: false,
        value,
      }
    } else {
      throw new UnsupportedError(`Unsupported operator '${operator}'`)
    }
  } else if ('NullTest' in expression) {
    const { fields } = expression.NullTest.arg.ColumnRef

    const [field] = fields

    if (!('String' in field)) {
      const [fieldType] = Object.keys(field)
      throw new UnsupportedError(`WHERE clause fields must be String type, received '${fieldType}'`)
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
      throw new UnsupportedError(`Unknown boolop '${expression.BoolExpr.boolop}'`)
    }

    const values = expression.BoolExpr.args.map((arg) => processWhereClause(arg))

    // The 'not' operator is special - instead of wrapping its child,
    // we just return the child directly and set negate=true on it.
    if (operator === 'not') {
      if (values.length > 1) {
        throw new UnsupportedError(
          `NOT expressions must have only 1 child, but received ${values.length} children`
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
    throw new UnsupportedError(`The WHERE clause must contain an expression`)
  }
}

function processSortClause(sorts: SortBy[]): Sort[] {
  return sorts.map((sortBy) => {
    if ('TypeCast' in sortBy.SortBy.node) {
      throw new UnsupportedError('Casting is not supported in the ORDER BY clause')
    }

    if (!('ColumnRef' in sortBy.SortBy.node)) {
      throw new UnsupportedError('ORDER BY clause only accepts columns')
    }

    const { fields } = sortBy.SortBy.node.ColumnRef

    const [field] = fields

    if (!('String' in field)) {
      const [fieldType] = Object.keys(field)
      throw new UnsupportedError(
        `ORDER BY column fields must be String type, received '${fieldType}'`
      )
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
      throw new UnsupportedError(`Unknown sort by direction '${direction}'`)
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
      throw new UnsupportedError(`Unknown sort by nulls '${nulls}'`)
  }
}

function processLimit(selectStmt: SelectStmt): Limit | undefined {
  let count: number | undefined = undefined
  let offset: number | undefined = undefined

  if (selectStmt.SelectStmt.limitCount) {
    if (!('ival' in selectStmt.SelectStmt.limitCount.A_Const)) {
      throw new UnsupportedError(`Limit count must be an integer`)
    }

    count = selectStmt.SelectStmt.limitCount.A_Const.ival.ival
  }

  if (selectStmt.SelectStmt.limitOffset) {
    if (!('ival' in selectStmt.SelectStmt.limitOffset.A_Const)) {
      throw new UnsupportedError(`Limit offset must be an integer`)
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
      throw new UnsupportedError(`Unsupported join type '${joinType}'`)
  }
}

function mapOperatorSymbol(kind: A_Expr['A_Expr']['kind'], operatorSymbol: string) {
  switch (kind) {
    case 'AEXPR_OP': {
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
        case '~':
          return 'match'
        case '~*':
          return 'imatch'
        default:
          throw new UnsupportedError(`Unsupported operator '${operatorSymbol}'`)
      }
    }
    case 'AEXPR_LIKE': {
      switch (operatorSymbol) {
        case '~~':
          return 'like'
        default:
          throw new UnsupportedError(`Unsupported operator '${operatorSymbol}'`)
      }
    }
    case 'AEXPR_ILIKE': {
      switch (operatorSymbol) {
        case '~~*':
          return 'ilike'
        default:
          throw new UnsupportedError(`Unsupported operator '${operatorSymbol}'`)
      }
    }
    case 'AEXPR_IN': {
      switch (operatorSymbol) {
        case '=':
          return 'in'
        default:
          throw new UnsupportedError(`Unsupported operator '${operatorSymbol}'`)
      }
    }
  }
}

function renderFields(fields: Field[]) {
  return fields
    .map((field) => {
      if ('String' in field) {
        return field.String.sval
      } else if ('A_Star' in field) {
        return '*'
      } else {
        const [internalType] = Object.keys(field)
        throw new UnsupportedError(
          `Unsupported internal type '${internalType}' for data type names`
        )
      }
    })
    .join('.')
}

function renderDataType(names: PgString[]) {
  const [first, ...rest] = names

  if (first.String.sval === 'pg_catalog' && rest.length === 1) {
    const [name] = rest

    // The PG parser converts some data types, eg. int -> pg_catalog.int4
    // so we'll map those back
    switch (name.String.sval) {
      case 'int2':
        return 'smallint'
      case 'int4':
        return 'int'
      case 'int8':
        return 'bigint'
      case 'float8':
        return 'float'
      default:
        return name.String.sval
    }
  } else if (rest.length > 0) {
    throw new UnsupportedError(
      `Casts can only reference data types by their unqualified name (not schema-qualified)`
    )
  } else {
    return first.String.sval
  }
}

function processJsonTarget(expression: A_Expr): ColumnTarget {
  if (expression.A_Expr.name.length > 1) {
    throw new UnsupportedError('Only one operator name supported per expression')
  }

  const [name] = expression.A_Expr.name
  const operator = name.String.sval

  if (!['->', '->>'].includes(operator)) {
    throw new UnsupportedError(`Invalid JSON operator`)
  }

  let cast: string | undefined = undefined
  let left: string
  let right: string

  if ('A_Const' in expression.A_Expr.lexpr) {
    if ('sval' in expression.A_Expr.lexpr.A_Const) {
      left = expression.A_Expr.lexpr.A_Const.sval.sval
    } else {
      throw new UnsupportedError('Invalid JSON path')
    }
  } else if ('A_Expr' in expression.A_Expr.lexpr) {
    const { column } = processJsonTarget(expression.A_Expr.lexpr)
    left = column
  } else if ('ColumnRef' in expression.A_Expr.lexpr) {
    left = renderFields(expression.A_Expr.lexpr.ColumnRef.fields)
  } else {
    throw new UnsupportedError('Invalid JSON path')
  }

  if ('A_Const' in expression.A_Expr.rexpr) {
    if ('sval' in expression.A_Expr.rexpr.A_Const) {
      right = expression.A_Expr.rexpr.A_Const.sval.sval
    } else {
      throw new UnsupportedError('Invalid JSON path')
    }
  } else if ('TypeCast' in expression.A_Expr.rexpr) {
    cast = renderDataType(expression.A_Expr.rexpr.TypeCast.typeName.names)

    if ('A_Const' in expression.A_Expr.rexpr.TypeCast.arg) {
      if ('sval' in expression.A_Expr.rexpr.TypeCast.arg.A_Const) {
        right = expression.A_Expr.rexpr.TypeCast.arg.A_Const.sval.sval
      } else {
        throw new UnsupportedError('Invalid JSON path')
      }
    } else {
      throw new UnsupportedError('Invalid JSON path')
    }
  } else {
    throw new UnsupportedError('Invalid JSON path')
  }

  return {
    type: 'column-target',
    column: `${left}${operator}${right}`,
    cast,
  }
}

/**
 * Recursively iterates through PostgREST filters and checks if the predicate
 * matches any of them (ie. `some()`).
 */
export function someFilter(filter: Filter, predicate: (filter: ColumnFilter) => boolean): boolean {
  const { type } = filter

  if (type === 'column') {
    return predicate(filter)
  } else if (type === 'logical') {
    return filter.values.some((f) => someFilter(f, predicate))
  } else {
    throw new UnsupportedError(`Unknown filter type '${type}'`)
  }
}

/**
 * Recursively iterates through a PostgREST target list and checks if the predicate
 * matches every one of them (ie. `some()`).
 */
export function everyTarget(
  targets: Target[],
  predicate: (target: ColumnTarget | AggregateTarget, parent?: EmbeddedTarget) => boolean,
  parent?: EmbeddedTarget
): boolean {
  return targets.every((target) => {
    const { type } = target

    if (type === 'column-target' || type === 'aggregate-target') {
      return predicate(target, parent)
    } else if (type === 'embedded-target') {
      return everyTarget(target.targets, predicate, target)
    } else {
      throw new UnsupportedError(`Unknown target type '${type}'`)
    }
  })
}

/**
 * Recursively iterates through a PostgREST target list and checks if the predicate
 * matches any of them (ie. `some()`).
 */
export function someTarget(
  targets: Target[],
  predicate: (target: ColumnTarget | AggregateTarget, parent?: EmbeddedTarget) => boolean,
  parent?: EmbeddedTarget
): boolean {
  return targets.some((target) => {
    const { type } = target

    if (type === 'column-target' || type === 'aggregate-target') {
      return predicate(target, parent)
    } else if (type === 'embedded-target') {
      return someTarget(target.targets, predicate, target)
    } else {
      throw new UnsupportedError(`Unknown target type '${type}'`)
    }
  })
}

/**
 * Recursively flattens PostgREST embedded targets.
 */
export function flattenTargets(targets: Target[]): Target[] {
  return targets.flatMap((target) => {
    const { type } = target
    if (type === 'column-target' || type === 'aggregate-target') {
      return target
    } else if (type === 'embedded-target') {
      return [target, ...flattenTargets(target.targets)]
    } else {
      throw new UnsupportedError(`Unknown target type '${type}'`)
    }
  })
}

function validateGroupClause(groupClause: ColumnRef[], targets: Target[], from: string) {
  const groupByColumns =
    groupClause.map((columnRef) => renderFields(columnRef.ColumnRef.fields)) ?? []

  if (
    !groupByColumns.every((column) =>
      someTarget(targets, (target, parent) => {
        // The `count()` special case aggregate has no column attached
        if (!('column' in target)) {
          return false
        }

        const paths = parent
          ? // joined columns have to be prefixed with their relation
            [[parent.alias ?? parent.relation, target.column]]
          : // top-level columns can be optionally prefixed with the primary table
            [[target.column], [from, target.column]]

        const qualifiedNames = paths.map((path) => path.join('.'))

        return qualifiedNames.includes(column)
      })
    )
  ) {
    throw new UnsupportedError(`Every group by column must also exist as a select target`)
  }

  if (
    someTarget(targets, (target) => target.type === 'aggregate-target') &&
    !everyTarget(targets, (target, parent) => {
      if (target.type === 'aggregate-target') {
        return true
      }

      const paths = parent
        ? // joined columns have to be prefixed with their relation
          [[parent.alias ?? parent.relation, target.column]]
        : // top-level columns can be optionally prefixed with the primary table
          [[target.column], [from, target.column]]

      const qualifiedNames = paths.map((path) => path.join('.'))

      return groupByColumns.some((column) => qualifiedNames.includes(column))
    })
  ) {
    throw new UnsupportedError(
      `Every non-aggregate select target must also exist in a group by clause`
    )
  }

  if (
    groupByColumns.length > 0 &&
    !someTarget(targets, (target) => target.type === 'aggregate-target')
  ) {
    throw new UnsupportedError(
      `There must be at least one aggregate function in the select target list when using group by`
    )
  }
}
function parseConstant(constant: A_Const) {
  if ('sval' in constant.A_Const) {
    return constant.A_Const.sval.sval
  } else if ('ival' in constant.A_Const) {
    return constant.A_Const.ival.ival
  } else if ('fval' in constant.A_Const) {
    return parseFloat(constant.A_Const.fval.fval)
  } else {
    throw new UnsupportedError(`Constant values must be a string, integer, or float`)
  }
}
