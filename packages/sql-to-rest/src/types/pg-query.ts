export type String = {
  String: {
    str: string
  }
}

export type Integer = {
  Integer: {
    ival: number
  }
}

export type A_Star = {
  A_Star: {}
}

export type A_Const = {
  A_Const: {
    val: String | Integer
    location: number
  }
}

/**
 * Infix, prefix, and postfix expressions
 *
 * https://github.com/postgres/postgres/blob/d12b4ba1bd3eedd862064cf1dad5ff107c5cba90/src/include/nodes/parsenodes.h#L308-L327
 */
export type A_Expr = {
  A_Expr: {
    kind:
      | 'AEXPR_OP'
      | 'AEXPR_OP_ANY'
      | 'AEXPR_OP_ALL'
      | 'AEXPR_DISTINCT'
      | 'AEXPR_NOT_DISTINCT'
      | 'AEXPR_NULLIF'
      | 'AEXPR_IN'
      | 'AEXPR_LIKE'
      | 'AEXPR_ILIKE'
      | 'AEXPR_SIMILAR'
      | 'AEXPR_BETWEEN'
      | 'AEXPR_NOT_BETWEEN'
      | 'AEXPR_BETWEEN_SYM'
      | 'AEXPR_NOT_BETWEEN_SYM'
    name: String[]
    lexpr: ColumnRef
    rexpr: A_Const
    location: number
  }
}

export type BoolExpr = {
  BoolExpr: {
    boolop: 'AND_EXPR' | 'OR_EXPR' | 'NOT_EXPR'
    args: (A_Expr | BoolExpr)[]
    location: number
  }
}

/**
 * The operation of testing a value for NULLness.
 *
 * https://github.com/postgres/postgres/blob/d12b4ba1bd3eedd862064cf1dad5ff107c5cba90/src/include/nodes/primnodes.h#L1903-L1935
 */
export type NullTest = {
  NullTest: {
    arg: ColumnRef
    nulltesttype: 'IS_NULL' | 'IS_NOT_NULL'
    location: number
  }
}

export type ColumnRef = {
  ColumnRef: {
    fields: (String | A_Star)[]
    location: number
  }
}

/**
 * Result target, used in target list of pre-transformed parse trees (select, insert, update).
 *
 * https://github.com/postgres/postgres/blob/d12b4ba1bd3eedd862064cf1dad5ff107c5cba90/src/include/nodes/parsenodes.h#L496-L521
 */
export type SelectResTarget = {
  ResTarget: {
    val: ColumnRef | A_Expr
    name?: string
    location: number
  }
}

/**
 * Range variable, used in FROM clauses.
 *
 * https://github.com/postgres/postgres/blob/d12b4ba1bd3eedd862064cf1dad5ff107c5cba90/src/include/nodes/primnodes.h#L63-L95
 */
export type RangeVar = {
  RangeVar: {
    /**
     * the schema name
     */
    schemaname?: string

    /**
     * the relation/sequence name
     */
    relname: string

    /**
     * expand rel by inheritance? recursively act on children?
     */
    inh: boolean

    relpersistence: string

    /**
     * token location
     */
    location: number

    /**
     * table alias & optional column aliases
     */
    alias?: string
  }
}

export type WhereClauseExpression = A_Expr | BoolExpr | NullTest

/**
 * Select statement.
 *
 * https://github.com/postgres/postgres/blob/d12b4ba1bd3eedd862064cf1dad5ff107c5cba90/src/include/nodes/parsenodes.h#L2121-L2168
 */
export type SelectStmt = {
  SelectStmt: {
    targetList: SelectResTarget[]
    fromClause?: RangeVar[]
    distinctClause?: any[]
    intoClause?: any[]
    whereClause?: WhereClauseExpression
    groupClause?: any[]
    groupDistinct?: boolean
    havingClause?: any[]
    limitOption: string
    op: string
  }
}

export type Stmt = {
  stmt: SelectStmt
}

export type ParsedQuery = {
  version: number
  stmts: Stmt[]
}
