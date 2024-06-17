import { PolicyInfo, assertAndUnwrapNode, assertDefined, unwrapNode } from 'common/sql-util'
import { CreatePolicyStmt, parseQuery } from 'libpg-query'
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
