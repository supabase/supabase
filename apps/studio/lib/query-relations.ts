import { z } from 'zod'

export const queryRelationReferenceSchema = z.object({
  schema: z.string().nullable(),
  name: z.string(),
})

/** A relation a query names, as written: unqualified names leave `schema` null. */
export type QueryRelationReference = z.infer<typeof queryRelationReferenceSchema>

const rangeVarSchema = z.object({ relname: z.string(), schemaname: z.string().optional() })
/** `table` is a policy's target, `view` a view's name, `rel` the table `CREATE TABLE AS` makes. */
const RELATION_FIELDS = ['relation', 'table', 'view', 'rel']
const cteSchema = z.object({ CommonTableExpr: z.object({ ctename: z.string() }) })

/**
 * Every relation a parsed statement reads or writes, in order of first appearance. An
 * unqualified name that matches one of the statement's CTEs is left out, since it refers to
 * the CTE rather than to anything in the database.
 */
export function getQueryRelations(ast: unknown): QueryRelationReference[] {
  const relations: QueryRelationReference[] = []
  const cteNames = new Set<string>()

  const add = (node: unknown) => {
    const parsed = rangeVarSchema.safeParse(node)
    if (parsed.success) {
      relations.push({ schema: parsed.data.schemaname ?? null, name: parsed.data.relname })
    }
  }

  const traverse = (node: unknown): void => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) return node.forEach(traverse)

    const cte = cteSchema.safeParse(node)
    if (cte.success) cteNames.add(cte.data.CommonTableExpr.ctename)
    if ('RangeVar' in node) add(node.RangeVar)
    // Fields typed as a single relation are written without the RangeVar wrapper.
    for (const field of RELATION_FIELDS) {
      if (field in node) add(Reflect.get(node, field))
    }

    Object.values(node).forEach(traverse)
  }

  traverse(ast)

  const seen = new Set<string>()
  return relations.filter(({ schema, name }) => {
    if (schema === null && cteNames.has(name)) return false
    const key = JSON.stringify([schema, name])
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const formatRelation = ({ schema, name }: QueryRelationReference) =>
  schema && schema !== 'public' ? `${schema}.${name}` : name

const listRelations = (relations: readonly QueryRelationReference[]) => {
  const [first, second, ...rest] = relations.map(formatRelation)
  if (second === undefined) return first
  if (rest.length === 0) return `${first} and ${second}`
  return `${first} and ${rest.length + 1} others`
}

/**
 * Statements named for what they do to the relation they name first — the written target for
 * a write, the created object for DDL. Statements that don't act on a relation have a fixed
 * label.
 */
const STATEMENT_LABELS: Record<
  string,
  (relations: readonly QueryRelationReference[]) => string | undefined
> = {
  SelectStmt: (relations) =>
    relations.length > 0 ? `Select from ${listRelations(relations)}` : 'Select',
  InsertStmt: ([target]) => target && `Insert into ${formatRelation(target)}`,
  UpdateStmt: ([target]) => target && `Update ${formatRelation(target)}`,
  DeleteStmt: ([target]) => target && `Delete from ${formatRelation(target)}`,
  MergeStmt: ([target]) => target && `Merge into ${formatRelation(target)}`,
  TruncateStmt: (relations) =>
    relations.length > 0 ? `Truncate ${listRelations(relations)}` : undefined,
  CreateStmt: ([target]) => target && `Create table ${formatRelation(target)}`,
  CreateTableAsStmt: ([target]) => target && `Create ${formatRelation(target)}`,
  ViewStmt: ([target]) => target && `Create view ${formatRelation(target)}`,
  AlterTableStmt: ([target]) => target && `Alter ${formatRelation(target)}`,
  IndexStmt: ([target]) => target && `Create index on ${formatRelation(target)}`,
  CreatePolicyStmt: ([target]) => target && `Create policy on ${formatRelation(target)}`,
  AlterPolicyStmt: ([target]) => target && `Alter policy on ${formatRelation(target)}`,
  CreateTrigStmt: ([target]) => target && `Create trigger on ${formatRelation(target)}`,
  RefreshMatViewStmt: ([target]) => target && `Refresh ${formatRelation(target)}`,
  CopyStmt: ([target]) => target && `Copy ${formatRelation(target)}`,
  CreateFunctionStmt: () => 'Create function',
  CreateSchemaStmt: () => 'Create schema',
  CreateExtensionStmt: () => 'Create extension',
  CreateEnumStmt: () => 'Create type',
  CompositeTypeStmt: () => 'Create type',
  DropStmt: () => 'Drop',
  GrantStmt: () => 'Grant',
  GrantRoleStmt: () => 'Grant role',
  CreateRoleStmt: () => 'Create role',
  CommentStmt: () => 'Comment',
  DoStmt: () => 'Run DO block',
  ExplainStmt: () => 'Explain',
  CallStmt: () => 'Call procedure',
  VacuumStmt: () => 'Vacuum',
  VariableSetStmt: () => 'Set',
  VariableShowStmt: () => 'Show',
  TransactionStmt: () => 'Transaction',
}

/**
 * A short name for what a query does, such as "Select from orders and users" or "Create
 * table todos", for showing in place of a generic title. Undefined when the statement isn't
 * one it knows how to describe.
 */
export function getQueryLabel({
  statementType,
  statementCount,
  relations,
}: {
  statementType: string | null
  statementCount: number
  relations: readonly QueryRelationReference[]
}) {
  const label = statementType ? STATEMENT_LABELS[statementType]?.(relations) : undefined
  if (!label) return undefined
  const others = statementCount - 1
  return others > 0
    ? `${label} and ${others} more ${others === 1 ? 'statement' : 'statements'}`
    : label
}
