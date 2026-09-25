import type { Node, ParseResult, RangeVar } from 'libpg-query'

import type { ProjectFile, ProjectResource, ProjectResourceDiagnostic } from './types'

const tableId = (schema: string, name: string) => `table:${JSON.stringify([schema, name])}`

/** Analyze top-level DDL only. References, policy targets and SQL inside function bodies are not declarations. */
export async function analyzeTables(
  files: readonly ProjectFile[],
  diagnostics: ProjectResourceDiagnostic[]
): Promise<ProjectResource[]> {
  const sqlFiles = files.filter((file) =>
    /^supabase\/(?:migrations|schemas)\/.+\.sql$/i.test(file.path)
  )
  if (!sqlFiles.length) return []
  const { parse } = await import('libpg-query')
  const tables = new Map<string, ProjectResource>()

  for (const file of sqlFiles) {
    if (file.content === undefined) {
      diagnostics.push({
        code: 'missing-content',
        message: 'SQL source is required to identify tables.',
        files: [file.path],
      })
      continue
    }
    let parsed: ParseResult
    try {
      parsed = await parse(file.content)
    } catch {
      diagnostics.push({
        code: 'invalid-sql',
        message:
          'Postgres could not parse this SQL file; its table declarations were not analyzed.',
        files: [file.path],
      })
      continue
    }

    // Supabase's default schema is public. A static SET search_path in this file can override it.
    let currentSchema: string | undefined = 'public'
    let transaction:
      | { tables: Map<string, ProjectResource>; schema?: string; localSearchPath?: boolean }
      | undefined
    const identify = (relation: RangeVar | undefined, schema = currentSchema) => {
      if (!relation?.relname || relation.relpersistence === 't') return undefined
      const resolvedSchema = relation.schemaname ?? schema
      if (!resolvedSchema) {
        diagnostics.push({
          code: 'ambiguous-schema',
          message: `Cannot resolve the schema for table "${relation.relname}" from this file's search_path.`,
          files: [file.path],
        })
        return undefined
      }
      return {
        name: relation.relname,
        schema: resolvedSchema,
        id: tableId(resolvedSchema, relation.relname),
      }
    }
    const add = (relation: RangeVar | undefined, schema = currentSchema) => {
      const identity = identify(relation, schema)
      if (!identity) return
      const previous = tables.get(identity.id)
      tables.set(identity.id, {
        ...identity,
        kind: 'table',
        files: [...new Set([...(previous?.files ?? []), file.path])],
      })
    }
    const move = (relation: RangeVar | undefined, newName?: string, newSchema?: string) => {
      const identity = identify(relation)
      if (!identity) return
      const existing = tables.get(identity.id)
      if (!existing) return // Altering an existing database table does not add it to this project.
      const name = newName ?? identity.name
      const schema = newSchema ?? identity.schema
      const id = tableId(schema, name)
      if (id !== identity.id && tables.has(id)) {
        diagnostics.push({
          code: 'unsupported-sql',
          message:
            'A table rename or schema move conflicts with another declared table; the move was not applied.',
          files: [file.path],
        })
        return
      }
      tables.delete(identity.id)
      tables.set(id, {
        ...existing,
        id,
        name,
        schema,
        files: [...new Set([...existing.files, file.path])],
      })
    }
    const visit = (node: Node, schema = currentSchema) => {
      if ('CreateStmt' in node) add(node.CreateStmt.relation, schema)
      else if ('CreateTableAsStmt' in node && node.CreateTableAsStmt.objtype === 'OBJECT_TABLE') {
        add(node.CreateTableAsStmt.into?.rel, schema)
      } else if ('SelectStmt' in node && node.SelectStmt.intoClause) {
        add(node.SelectStmt.intoClause.rel, schema)
      } else if ('CreateSchemaStmt' in node) {
        for (const child of node.CreateSchemaStmt.schemaElts ?? [])
          visit(child, node.CreateSchemaStmt.schemaname)
      } else if ('DropStmt' in node && node.DropStmt.removeType === 'OBJECT_TABLE') {
        for (const object of node.DropStmt.objects ?? []) {
          const names =
            'List' in object
              ? object.List.items?.map((part) => ('String' in part ? part.String.sval : undefined))
              : undefined
          if (names?.length === 1 || names?.length === 2) {
            const identity = identify({
              relname: names[names.length - 1],
              schemaname: names.length === 2 ? names[0] : undefined,
            })
            if (identity) tables.delete(identity.id)
          }
        }
        if (node.DropStmt.behavior === 'DROP_CASCADE') {
          diagnostics.push({
            code: 'unsupported-sql',
            message:
              'DROP TABLE CASCADE may remove other dependent tables; only explicitly named tables were removed from this inventory.',
            files: [file.path],
          })
        }
      } else if ('RenameStmt' in node && node.RenameStmt.renameType === 'OBJECT_TABLE') {
        move(node.RenameStmt.relation, node.RenameStmt.newname)
      } else if (
        'AlterObjectSchemaStmt' in node &&
        node.AlterObjectSchemaStmt.objectType === 'OBJECT_TABLE'
      ) {
        move(node.AlterObjectSchemaStmt.relation, undefined, node.AlterObjectSchemaStmt.newschema)
      } else if ('VariableSetStmt' in node && node.VariableSetStmt.name === 'search_path') {
        const statement = node.VariableSetStmt
        const argument = statement.args?.[0]
        const value = argument && 'A_Const' in argument ? argument.A_Const.sval?.sval : undefined
        currentSchema =
          statement.kind === 'VAR_RESET' || statement.kind === 'VAR_SET_DEFAULT'
            ? 'public'
            : value && !value.includes(',') && value !== '$user'
              ? value
              : undefined
        if (transaction && statement.is_local) transaction.localSearchPath = true
      } else if ('DoStmt' in node || 'CallStmt' in node) {
        diagnostics.push({
          code: 'unsupported-sql',
          message:
            'Procedural SQL may change tables at runtime; only explicit top-level table declarations are analyzed.',
          files: [file.path],
        })
      } else if ('DropStmt' in node && node.DropStmt.removeType === 'OBJECT_SCHEMA') {
        diagnostics.push({
          code: 'unsupported-sql',
          message: 'Schema drops and their dependent objects are not evaluated.',
          files: [file.path],
        })
      } else if ('TransactionStmt' in node) {
        const kind = node.TransactionStmt.kind
        if (kind === 'TRANS_STMT_BEGIN' || kind === 'TRANS_STMT_START') {
          transaction = { tables: new Map(tables), schema: currentSchema }
        } else if (kind === 'TRANS_STMT_ROLLBACK' && transaction) {
          tables.clear()
          for (const [id, table] of transaction.tables) tables.set(id, table)
          currentSchema = transaction.schema
          transaction = undefined
        } else if (kind === 'TRANS_STMT_COMMIT') {
          if (transaction?.localSearchPath) currentSchema = transaction.schema
          transaction = undefined
        } else {
          diagnostics.push({
            code: 'unsupported-sql',
            message:
              'Savepoints or transaction control without a matching BEGIN are not evaluated.',
            files: [file.path],
          })
        }
      }
    }
    for (const statement of parsed.stmts ?? []) {
      if (statement.stmt) visit(statement.stmt)
    }
  }
  return [...tables.values()]
}
