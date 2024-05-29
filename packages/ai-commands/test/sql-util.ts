import { parseQuery, A_Expr, CreatePolicyStmt, Node } from 'libpg-query'

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

/**
 * Asserts that a value is defined.
 *
 * Useful for type narrowing.
 */
export function assertDefined<T>(value: T | undefined, errorMessage: string): asserts value is T {
  if (value === undefined) {
    throw new Error(errorMessage)
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
    throw new Error(errorMessage)
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
    throw new Error(errorMessage)
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
 * Extracts all the `CREATE POLICY` statements
 * from a SQL string as parsed ASTs.
 */
export async function getPolicies(sql: string) {
  const result = await parseQuery(sql)

  assertDefined(result.stmts, 'Expected parse result to contain statements')

  return result.stmts?.reduce<CreatePolicyStmt[]>((filtered, stmt) => {
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
