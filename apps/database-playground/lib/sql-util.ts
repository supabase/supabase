import { Statement, assertDefined, unwrapNode, unwrapOneOfNode } from 'common/sql-util'
import { Node, RawStmt } from 'libpg-query/wasm'

/**
 * Groups SQL statements into queries, seeds, and migrations
 * based on heuristics.
 */
export function groupStatements(rawStatements: RawStmt[]) {
  return rawStatements.reduce<{
    queries: Statement[]
    seeds: Statement[]
    migrations: Statement[]
  }>(
    (merged, stmt) => {
      assertDefined(stmt.stmt, 'Expected statement to exist')

      const queryStatement = unwrapQueryStatement(stmt.stmt)

      if (queryStatement) {
        return {
          ...merged,
          queries: [...merged.queries, queryStatement],
        }
      }

      const seedStatement = unwrapSeedStatement(stmt.stmt)

      if (seedStatement) {
        return {
          ...merged,
          seeds: [...merged.seeds, seedStatement],
        }
      }

      const migrationStatement = unwrapMigrationStatement(stmt.stmt)

      if (migrationStatement) {
        return {
          ...merged,
          migrations: [...merged.migrations, stmt.stmt],
        }
      }

      throw new Error('Unsupported SQL statement')
    },
    { queries: [], seeds: [], migrations: [] }
  )
}

export function unwrapSeedStatement(node: Node) {
  // Insert, update, and delete statements are always considered seeds
  const statement = unwrapOneOfNode(node, ['InsertStmt', 'UpdateStmt', 'DeleteStmt', 'MergeStmt'])

  if (statement) {
    return statement
  }

  // Select statements are considered seeds if they insert into another table
  const selectStatement = unwrapNode(node, 'SelectStmt')

  if (selectStatement?.intoClause) {
    return selectStatement
  }
}

export function unwrapQueryStatement(node: Node) {
  // Select statements are considered queries if they don't insert into another table
  const selectStatement = unwrapNode(node, 'SelectStmt')

  if (selectStatement && !selectStatement.intoClause) {
    return selectStatement
  }
}

export function unwrapMigrationStatement(node: Node) {
  const statement = unwrapOneOfNode(node, [
    'ReturnStmt',
    'PLAssignStmt',
    'AlterTableStmt',
    'AlterDomainStmt',
    'SetOperationStmt',
    'GrantStmt',
    'GrantRoleStmt',
    'AlterDefaultPrivilegesStmt',
    'ClosePortalStmt',
    'ClusterStmt',
    'CopyStmt',
    'CreateStmt',
    'DefineStmt',
    'DropStmt',
    'TruncateStmt',
    'CommentStmt',
    'FetchStmt',
    'IndexStmt',
    'CreateFunctionStmt',
    'AlterFunctionStmt',
    'DoStmt',
    'RenameStmt',
    'RuleStmt',
    'NotifyStmt',
    'ListenStmt',
    'UnlistenStmt',
    'TransactionStmt',
    'ViewStmt',
    'LoadStmt',
    'CreateDomainStmt',
    'CreatedbStmt',
    'DropdbStmt',
    'VacuumStmt',
    'ExplainStmt',
    'CreateTableAsStmt',
    'CreateSeqStmt',
    'AlterSeqStmt',
    'VariableSetStmt',
    'VariableShowStmt',
    'DiscardStmt',
    'CreateTrigStmt',
    'CreatePLangStmt',
    'CreateRoleStmt',
    'AlterRoleStmt',
    'DropRoleStmt',
    'LockStmt',
    'ConstraintsSetStmt',
    'ReindexStmt',
    'CheckPointStmt',
    'CreateSchemaStmt',
    'AlterDatabaseStmt',
    'AlterDatabaseRefreshCollStmt',
    'AlterDatabaseSetStmt',
    'AlterRoleSetStmt',
    'CreateConversionStmt',
    'CreateCastStmt',
    'CreateOpClassStmt',
    'CreateOpFamilyStmt',
    'AlterOpFamilyStmt',
    'PrepareStmt',
    'ExecuteStmt',
    'DeallocateStmt',
    'DeclareCursorStmt',
    'CreateTableSpaceStmt',
    'DropTableSpaceStmt',
    'AlterObjectDependsStmt',
    'AlterObjectSchemaStmt',
    'AlterOwnerStmt',
    'AlterOperatorStmt',
    'AlterTypeStmt',
    'DropOwnedStmt',
    'ReassignOwnedStmt',
    'CompositeTypeStmt',
    'CreateEnumStmt',
    'CreateRangeStmt',
    'AlterEnumStmt',
    'AlterTSDictionaryStmt',
    'AlterTSConfigurationStmt',
    'CreateFdwStmt',
    'AlterFdwStmt',
    'CreateForeignServerStmt',
    'AlterForeignServerStmt',
    'CreateUserMappingStmt',
    'AlterUserMappingStmt',
    'DropUserMappingStmt',
    'AlterTableSpaceOptionsStmt',
    'AlterTableMoveAllStmt',
    'SecLabelStmt',
    'CreateForeignTableStmt',
    'ImportForeignSchemaStmt',
    'CreateExtensionStmt',
    'AlterExtensionStmt',
    'AlterExtensionContentsStmt',
    'CreateEventTrigStmt',
    'AlterEventTrigStmt',
    'RefreshMatViewStmt',
    'ReplicaIdentityStmt',
    'AlterSystemStmt',
    'CreatePolicyStmt',
    'AlterPolicyStmt',
    'CreateTransformStmt',
    'CreateAmStmt',
    'CreatePublicationStmt',
    'AlterPublicationStmt',
    'CreateSubscriptionStmt',
    'AlterSubscriptionStmt',
    'DropSubscriptionStmt',
    'CreateStatsStmt',
    'AlterCollationStmt',
    'CallStmt',
    'AlterStatsStmt',
  ])

  if (statement) {
    return statement
  }
}
