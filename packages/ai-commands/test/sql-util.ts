import { A_Const, A_Expr, ColumnRef, CreatePolicyStmt, Node, parseQuery } from 'libpg-query'

export type PolicyInfo = {
  name: string
  relation: string
  command?: string
  roles: string[]
  usingNode?: Node
  withCheckNode?: Node
}

/**
 * Extracts keys from a union type.
 */
type ExtractKeys<T> = T extends T ? keyof T : never

/**
 * Unwraps a Node to get its underlying value.
 */
type NodeValue<T extends Node, U extends ExtractKeys<Node>> = T extends Record<U, infer V>
  ? V
  : never

export class AssertionError extends Error {
  constructor(message: string) {
    super(message)

    // Pop the top line from the stack trace so that
    // debug tools will reference the code calling the
    // assertion function and not this error within it
    if (this.stack) {
      // Capture the current stack trace and split it into lines
      const stackLines = this.stack.split('\n')

      // Remove the second line which is the current constructor
      stackLines.splice(1, 1)

      // Reassign the modified stack trace back to the error object
      this.stack = stackLines.join('\n')
    }
  }
}

/**
 * Asserts that a value is defined.
 *
 * Useful for type narrowing.
 */
export function assertDefined<T>(value: T | undefined, errorMessage: string): asserts value is T {
  if (value === undefined) {
    throw new AssertionError(errorMessage)
  }
}

/**
 * Asserts that a `Node` is a specific type.
 *
 * Useful for type narrowing.
 */
export function assertNodeType<T extends Node>(
  node: Node,
  type: ExtractKeys<T>,
  errorMessage: string
): asserts node is T {
  if (!(type in node)) {
    throw new AssertionError(errorMessage)
  }
}

/**
 * Asserts that a `Node` is a specific type and
 * unwraps its underlying value.
 *
 * @returns The unwrapped `Node` value.
 * @throws If `node` is not of type `type`.
 */
export function assertAndUnwrapNode<T extends Node, U extends ExtractKeys<Node>>(
  node: Node,
  type: U,
  errorMessage: string
): NodeValue<T, U> {
  if (!(type in node)) {
    throw new AssertionError(errorMessage)
  }
  return (node as any)[type]
}

/**
 * Unwraps a `Node`'s underlying value.
 *
 * @returns The unwrapped `Node` value or `undefined` if
 * the node is not of type `type`.
 */
export function unwrapNode<T extends Node, U extends ExtractKeys<Node>>(
  node: Node,
  type: U
): NodeValue<T, U> | undefined {
  if (!(type in node)) {
    return undefined
  }
  return (node as any)[type]
}

/**
 * Asserts that either the left or right side of the
 * expression is processed through `fn` without throwing
 * any errors.
 *
 * If both sides throw errors, the assertion fails and the
 * error from the left side will be thrown.
 */
export function assertEitherSideOfExpression<U>(
  expression: A_Expr,
  fn: (node: Node, side: 'left' | 'right') => U
): U {
  assertDefined(expression.lexpr, 'Expected left side of expression to exist')
  assertDefined(expression.rexpr, 'Expected right side of expression to exist')

  try {
    return fn(expression.lexpr, 'left')
  } catch (leftError) {
    try {
      return fn(expression.rexpr, 'right')
    } catch (rightError) {
      throw leftError
    }
  }
}
/**
 * Asserts that both sides of the expression are processed
 * without throwing any errors.
 *
 * Order doesn't matter. As long as `firstFn` and `secondFn`
 * pass separately on either side of the expression, the assertion
 * will pass. Otherwise if `firstFn` and `secondFn` both fail
 * after trying on both sides separately, the assertion will fail.
 */
export function assertEachSideOfExpression<U>(
  expression: A_Expr,
  firstFn: (node: Node) => void,
  secondFn: (node: Node) => void
): void {
  assertDefined(expression.lexpr, 'Expected left side of expression to exist')
  assertDefined(expression.rexpr, 'Expected right side of expression to exist')

  let firstSide: Node
  let secondSide: Node

  try {
    // Try `firstFn` on the left first
    firstSide = expression.lexpr
    secondSide = expression.rexpr
    firstFn(firstSide)
  } catch (firstError) {
    // Otherwise try `firstFn` on the right
    firstSide = expression.rexpr
    secondSide = expression.lexpr
    try {
      firstFn(firstSide)
    } catch (secondError) {
      // `firstFn` failed on both sides, so we
      // need to throw an error not matter what

      // Perform one more test using `secondFn`
      // to help determine which error to show
      // for `firstFn`
      try {
        secondFn(secondSide)
      } catch (_) {
        throw firstError
      }
      throw secondError
    }
  }

  try {
    // `firstFn` passed on one of the sides, so
    // try `secondFn` on the opposite side
    secondFn(secondSide)
  } catch (err) {
    // `secondFn` failed, so we need to throw an error
    throw err
  }
}

/**
 * Extracts all the `CREATE POLICY` statements
 * from a SQL string as parsed ASTs.
 */
export async function getPolicies(sql: string) {
  const result = await parseQuery(sql)

  assertDefined(result.stmts, 'Expected parse result to contain statements')

  return result.stmts.reduce<CreatePolicyStmt[]>((filtered, stmt) => {
    assertDefined(stmt.stmt, 'Expected statement to exist')

    const createPolicyStatement = unwrapNode(stmt.stmt, 'CreatePolicyStmt')

    if (createPolicyStatement) {
      return [...filtered, createPolicyStatement]
    }

    return filtered
  }, [])
}

/**
 * Parses a Postgres SQL policy.
 *
 * @returns Information about the policy, including its name, table, command, and expressions.
 */
export async function getPolicyInfo(createPolicyStatement: CreatePolicyStmt) {
  assertDefined(createPolicyStatement.policy_name, 'Expected policy to have a name')
  assertDefined(createPolicyStatement.table?.relname, 'Expected policy to have a relation')

  const name = createPolicyStatement.policy_name
  const relation = createPolicyStatement.table.relname
  const command = createPolicyStatement.cmd_name

  const roles =
    createPolicyStatement.roles?.map((node) => {
      const roleSpec = assertAndUnwrapNode(
        node,
        'RoleSpec',
        'Expected roles to contain a list of RoleSpec'
      )
      assertDefined(roleSpec.rolename, 'Expected RoleSpec to have a rolename')

      return roleSpec.rolename
    }) ?? []

  const usingExpression = createPolicyStatement.qual
  const checkExpression = createPolicyStatement.with_check

  const policyInfo: PolicyInfo = {
    name,
    relation,
    command,
    roles,
    usingNode: usingExpression,
    withCheckNode: checkExpression,
  }

  return policyInfo
}

export function renderTargets<T>(targets: Node[], renderTarget: (node: Node) => T): T[] {
  return targets.map((node) => {
    const target = assertAndUnwrapNode(
      node,
      'ResTarget',
      'Expected target list to contain ResTargets'
    )

    assertDefined(target.val, 'Expected ResTarget to have a val')
    return renderTarget(target.val)
  })
}

export function renderColumn(column: ColumnRef) {
  assertDefined(column.fields, 'Expected column to have fields')
  return renderFields(column.fields)
}

export function assertAndRenderColumn(node: Node, errorMessage: string) {
  const column = assertAndUnwrapNode(node, 'ColumnRef', errorMessage)
  return renderColumn(column)
}

export function renderJsonExpression(expression: A_Expr): string {
  assertDefined(expression.name, 'Expected expression to have an operator')

  if (expression.name.length > 1) {
    throw new AssertionError('Only one JSON operator supported per expression')
  }

  const [name] = expression.name
  const operatorString = assertAndUnwrapNode(
    name,
    'String',
    'Expected JSON operator to be a string'
  )
  assertDefined(operatorString.sval, 'PG string expected to have an sval')
  const operator = operatorString.sval

  if (!['->', '->>'].includes(operator)) {
    throw new AssertionError(`Invalid JSON operator ${operator}`)
  }

  assertDefined(expression.lexpr, 'Expected JSON expression to have a left-side component')
  assertDefined(expression.rexpr, 'Expected JSON expression to have a right-side component')

  let left: string | number
  let right: string | number

  const leftConstant = unwrapNode(expression.lexpr, 'A_Const')
  const leftColumn = unwrapNode(expression.lexpr, 'ColumnRef')
  const leftFuncCall = unwrapNode(expression.lexpr, 'FuncCall')
  const leftExpression = unwrapNode(expression.lexpr, 'A_Expr')

  if (leftConstant) {
    // JSON path cannot contain a float
    if ('fval' in leftConstant) {
      throw new AssertionError('Invalid JSON path: Expression cannot contain a float')
    }
    left = `'${parseConstant(leftConstant)}'`
  } else if (leftColumn) {
    left = renderColumn(leftColumn)
  } else if (leftFuncCall) {
    assertDefined(leftFuncCall.funcname, 'Expected function call to have a name')
    const functionName = renderFields(leftFuncCall.funcname)
    left = `${functionName}()`
  } else if (leftExpression) {
    left = renderJsonExpression(leftExpression)
  } else {
    throw new AssertionError('Invalid JSON path')
  }

  const rightConstant = unwrapNode(expression.rexpr, 'A_Const')

  if (rightConstant) {
    // JSON path cannot contain a float
    if ('fval' in rightConstant) {
      throw new AssertionError('Invalid JSON path: Expression cannot contain a float')
    }
    right = `'${parseConstant(rightConstant)}'`
  } else {
    throw new AssertionError('Invalid JSON path')
  }

  return `${left}${operator}${right}`
}

export function renderFields(fields: Node[]) {
  const nameSegments = fields
    .map((field) => {
      const stringField = unwrapNode(field, 'String')
      const starField = unwrapNode(field, 'A_Star')

      if (stringField !== undefined) {
        return stringField.sval
      } else if (starField !== undefined) {
        return '*'
      } else {
        const [internalType] = Object.keys(field)
        throw new Error(`Unsupported internal type '${internalType}' for fields`)
      }
    })
    .filter((name): name is string => name !== undefined)

  return nameSegments.join('.')
}

export function parseConstant(constant: A_Const) {
  if ('sval' in constant) {
    return constant.sval?.sval ?? ''
  } else if ('ival' in constant) {
    // The PG parser turns 0 into undefined, so convert it back here
    return constant.ival?.ival ?? 0
  } else if ('fval' in constant) {
    return constant.fval?.fval ? parseFloat(constant.fval.fval) : 0
  } else {
    throw new AssertionError(`Constant values must be a string, integer, or float`)
  }
}
