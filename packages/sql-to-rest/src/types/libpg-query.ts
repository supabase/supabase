export type PgString = {
  String: {
    sval: string
  }
}

export type PgInteger = {
  Integer: {
    ival: number
  }
}

export type A_Star = {
  A_Star: {}
}

export type A_Const = {
  A_Const: { location: number } & (
    | {
        sval: {
          sval: string
        }
      }
    | {
        ival: {
          ival: number
        }
      }
    | {
        fval: {
          fval: string
        }
      }
  )
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
    name: PgString[]
    lexpr: A_Const | A_Expr | ColumnRef | TypeCast
    rexpr: A_Const | A_Expr | ColumnRef | TypeCast | List
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

export type Field = PgString | A_Star

export type ColumnRef = {
  ColumnRef: {
    fields: Field[]
    location: number
  }
}

export type TypeCast = {
  TypeCast: {
    arg: ColumnRef | A_Const
    typeName: {
      names: PgString[]
      typemod: number
      location: number
    }
    location: number
  }
}

export type List = {
  List: {
    items: A_Const[]
  }
}

export type FuncCall = {
  FuncCall: {
    funcname: PgString[]
    args?: (TypeCast | ColumnRef | FuncCall | A_Expr)[]
    agg_star?: boolean
    funcformat: string
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
    val: ColumnRef | TypeCast | A_Expr | FuncCall
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
    alias?: { aliasname: string }
  }
}

export type JoinExpr = {
  JoinExpr: {
    jointype: 'JOIN_INNER' | 'JOIN_LEFT'
    larg: FromExpression
    rarg: RangeVar
    quals: A_Expr | A_Const
  }
}

export type FromExpression = RangeVar | JoinExpr
export type WhereExpression = A_Expr | BoolExpr | NullTest

export type SortBy = {
  SortBy: {
    node: ColumnRef | A_Expr
    sortby_dir: string
    sortby_nulls: string
  }
}

/**
 * Select statement.
 *
 * https://github.com/postgres/postgres/blob/d12b4ba1bd3eedd862064cf1dad5ff107c5cba90/src/include/nodes/parsenodes.h#L2121-L2168
 */
export type SelectStmt = {
  SelectStmt: {
    targetList: SelectResTarget[]
    fromClause?: FromExpression[]
    distinctClause?: any[]
    intoClause?: any[]
    whereClause?: WhereExpression
    groupClause?: ColumnRef[]
    groupDistinct?: boolean
    havingClause?: any[]
    withClause?: any
    sortClause?: SortBy[]
    limitOption: string
    limitCount?: A_Const
    limitOffset?: A_Const
    op: string
  }
}

export type InsertStmt = {
  InsertStmt: {}
}

export type UpdateStmt = {
  UpdateStmt: {}
}

export type DeleteStmt = {
  DeleteStmt: {}
}

export type ExplainStmt = {
  ExplainStmt: {
    query: SelectStmt | InsertStmt | UpdateStmt | DeleteStmt
  }
}

export type Stmt = {
  stmt: SelectStmt | InsertStmt | UpdateStmt | DeleteStmt | ExplainStmt
}

export type ParsedQuery = {
  version: number
  stmts: Stmt[]
}
