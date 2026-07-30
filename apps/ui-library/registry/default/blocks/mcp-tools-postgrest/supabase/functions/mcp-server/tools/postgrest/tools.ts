import type { McpServer } from 'npm:@modelcontextprotocol/sdk@1.29.0/server/mcp'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.108.2'
import { z } from 'npm:zod@4.4.3'

import { jsonResult, runtimeErrorResult } from '../result.ts'
import type { ApiSchema, Column, Resource, RpcFunction } from './schema.ts'

// Turns the parsed API schema into MCP tools.
//
// The tools are intent-named (`list_todos`, not `GetTodos`) and take structured
// filters rather than raw PostgREST query syntax, because a model that has to
// guess `id=eq.<uuid>` from a bare string parameter gets it wrong. An operator
// enum gives it a menu instead, and this file does the translation.

/** Operators worth exposing. PostgREST supports more; these cover ordinary use. */
const FILTER_OPERATORS = [
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'like',
  'ilike',
  'in',
  'is',
  'cs',
  'cd',
] as const

const OPERATOR_GUIDE =
  'eq/neq: equal, not equal. gt/gte/lt/lte: ordering comparisons. ' +
  'like/ilike: pattern match, case-sensitive and insensitive, with * as the wildcard. ' +
  'in: comma-separated list of values. is: null, true, or false. ' +
  'cs/cd: contains, contained by, for array and json columns.'

const MAX_ROWS = 1000
const DEFAULT_ROWS = 50

type Filter = {
  column: string
  operator: (typeof FILTER_OPERATORS)[number]
  value: string
}

// -----------------------------------------------------------------------------
// Schema construction
// -----------------------------------------------------------------------------

/** MCP tool names allow letters, digits, underscore, and hyphen. */
function toolName(action: string, resource: string): string {
  const safe = resource.replace(/[^a-zA-Z0-9_-]/g, '_')
  return `${action}_${safe}`.slice(0, 128)
}

function columnNames(columns: Column[]): [string, ...string[]] {
  const names = columns.map((column) => column.name)
  return names as [string, ...string[]]
}

/** A one-line summary of the columns, so a model can plan without a second call. */
function columnSummary(columns: Column[]): string {
  return columns
    .map((column) => {
      const notes = [column.format, column.isPrimaryKey ? 'primary key' : null]
        .filter(Boolean)
        .join(', ')
      return notes ? `${column.name} (${notes})` : column.name
    })
    .join('; ')
}

function valueSchema(column: Column): z.ZodTypeAny {
  const description = [column.format ? `${column.format}.` : null, column.description]
    .filter(Boolean)
    .join(' ')

  const base = (() => {
    switch (column.type) {
      case 'integer':
        return z.number().int()
      case 'number':
        return z.number()
      case 'boolean':
        return z.boolean()
      case 'array':
        return z.array(z.unknown())
      case 'object':
      case 'json':
        // jsonb takes any JSON value, including scalars and arrays.
        return z.unknown()
      default:
        return z.string()
    }
  })()

  return description ? base.describe(description) : base
}

/** Row shape for an insert: only columns without a default are required. */
function insertShape(columns: Column[]): z.ZodRawShape {
  return Object.fromEntries(
    columns.map((column) => [
      column.name,
      column.isRequiredOnInsert ? valueSchema(column) : valueSchema(column).nullable().optional(),
    ])
  )
}

/** Row shape for an update: every column optional, and nullable to clear it. */
function updateShape(columns: Column[]): z.ZodRawShape {
  return Object.fromEntries(
    columns.map((column) => [column.name, valueSchema(column).nullable().optional()])
  )
}

function filterSchema(columns: Column[]) {
  return z.object({
    column: z.enum(columnNames(columns)).describe('Column to filter on.'),
    operator: z.enum(FILTER_OPERATORS).describe(OPERATOR_GUIDE),
    value: z
      .string()
      .describe(
        'Value to compare against, as text. For in, pass a comma-separated list. For is, pass null, true, or false.'
      ),
  })
}

const selectSchema = z
  .string()
  .optional()
  .describe(
    'Columns to return, comma-separated. Defaults to every column. Related rows can be embedded, e.g. "id,title,author(name)".'
  )

const orderSchema = z
  .string()
  .optional()
  .describe('Sort order, e.g. "created_at.desc" or "priority.asc,created_at.desc".')

// -----------------------------------------------------------------------------
// Query translation
// -----------------------------------------------------------------------------

/** Format a filter value for the operators that need a specific shape. */
function filterValue({ operator, value }: Filter): string {
  if (operator === 'in') {
    const list = value.replace(/^\(|\)$/g, '')
    return `(${list})`
  }
  return value
}

// The query builder's own generics change shape as calls are chained, so these
// helpers ask only for the method they use and for it to return the builder.
type Filterable<T> = { filter(column: string, operator: string, value: unknown): T }
type Orderable<T> = { order(column: string, options: { ascending: boolean }): T }

function applyFilters<T extends Filterable<T>>(query: T, filters: Filter[] | undefined): T {
  let filtered = query
  for (const filter of filters ?? []) {
    filtered = filtered.filter(filter.column, filter.operator, filterValue(filter))
  }
  return filtered
}

function applyOrder<T extends Orderable<T>>(query: T, order: string | undefined): T {
  let ordered = query
  for (const term of (order ?? '').split(',')) {
    const [column, direction] = term.trim().split('.')
    if (!column) continue
    ordered = ordered.order(column, { ascending: direction !== 'desc' })
  }
  return ordered
}

// -----------------------------------------------------------------------------
// Tool registration
// -----------------------------------------------------------------------------

function registerResourceTools(
  server: McpServer,
  supabase: SupabaseClient,
  resource: Resource
): void {
  const filter = filterSchema(resource.columns)
  const summary = columnSummary(resource.columns)
  const context = resource.description ? ` ${resource.description}` : ''

  if (resource.canSelect) {
    server.registerTool(
      toolName('list', resource.name),
      {
        description:
          `Read rows from ${resource.name}.${context} Columns: ${summary}. ` +
          'Row Level Security decides which rows are visible.',
        inputSchema: {
          filters: z.array(filter).optional().describe('Conditions, combined with AND.'),
          select: selectSchema,
          order: orderSchema,
          limit: z
            .number()
            .int()
            .min(1)
            .max(MAX_ROWS)
            .optional()
            .describe(`Maximum rows to return. Defaults to ${DEFAULT_ROWS}.`),
          offset: z.number().int().min(0).optional().describe('Rows to skip, for paging.'),
        },
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      },
      async ({ filters, select, order, limit, offset }) => {
        try {
          const size = limit ?? DEFAULT_ROWS
          const from = offset ?? 0

          let query = supabase.from(resource.name).select(select ?? '*')
          query = applyFilters(query, filters as Filter[] | undefined)
          query = applyOrder(query, order)
          query = query.range(from, from + size - 1)

          const { data, error } = await query
          if (error) throw error
          return jsonResult(data)
        } catch (error) {
          return runtimeErrorResult(error)
        }
      }
    )
  }

  if (resource.canInsert) {
    server.registerTool(
      toolName('create', resource.name),
      {
        description: `Insert rows into ${resource.name}.${context} Returns the inserted rows.`,
        inputSchema: {
          rows: z
            .array(z.object(insertShape(resource.columns)))
            .min(1)
            .describe('Rows to insert.'),
          select: selectSchema,
        },
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
      },
      async ({ rows, select }) => {
        try {
          const { data, error } = await supabase
            .from(resource.name)
            .insert(rows)
            .select(select ?? '*')
          if (error) throw error
          return jsonResult(data)
        } catch (error) {
          return runtimeErrorResult(error)
        }
      }
    )
  }

  if (resource.canUpdate) {
    server.registerTool(
      toolName('update', resource.name),
      {
        description:
          `Update rows in ${resource.name}.${context} Requires at least one filter, ` +
          'so an accidental call cannot rewrite the whole table. Returns the updated rows.',
        inputSchema: {
          // Required and non-empty: without a filter PostgREST would update
          // every row the caller can reach.
          filters: z
            .array(filter)
            .min(1)
            .describe('Conditions selecting the rows to update, combined with AND.'),
          values: z
            .object(updateShape(resource.columns))
            .describe('Columns to set. Pass null to clear a column.'),
          select: selectSchema,
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ filters, values, select }) => {
        try {
          let query = supabase.from(resource.name).update(values)
          query = applyFilters(query, filters as Filter[])
          const { data, error } = await query.select(select ?? '*')
          if (error) throw error
          return jsonResult(data)
        } catch (error) {
          return runtimeErrorResult(error)
        }
      }
    )
  }

  if (resource.canDelete) {
    server.registerTool(
      toolName('delete', resource.name),
      {
        description:
          `Delete rows from ${resource.name}.${context} Requires at least one filter, ` +
          'so an accidental call cannot empty the table. Returns the deleted rows.',
        inputSchema: {
          filters: z
            .array(filter)
            .min(1)
            .describe('Conditions selecting the rows to delete, combined with AND.'),
        },
        annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
      },
      async ({ filters }) => {
        try {
          let query = supabase.from(resource.name).delete()
          query = applyFilters(query, filters as Filter[])
          const { data, error } = await query.select('*')
          if (error) throw error
          return jsonResult(data)
        } catch (error) {
          return runtimeErrorResult(error)
        }
      }
    )
  }
}

function registerFunctionTool(
  server: McpServer,
  supabase: SupabaseClient,
  rpcFunction: RpcFunction
): void {
  // Annotated, because the two branches would otherwise widen to a union that
  // does not satisfy the SDK's raw-shape parameter.
  const shape: z.ZodRawShape = rpcFunction.args.length
    ? { args: z.object(insertShape(rpcFunction.args)).describe('Function arguments.') }
    : {}

  server.registerTool(
    toolName('call', rpcFunction.name),
    {
      description:
        `Call the database function ${rpcFunction.name}.` +
        (rpcFunction.description ? ` ${rpcFunction.description}` : ''),
      inputSchema: shape,
      annotations: {
        readOnlyHint: rpcFunction.isReadOnly,
        destructiveHint: !rpcFunction.isReadOnly,
        openWorldHint: false,
      },
    },
    async (input: { args?: Record<string, unknown> }) => {
      try {
        const { data, error } = await supabase.rpc(rpcFunction.name, input.args ?? {})
        if (error) throw error
        return jsonResult(data)
      } catch (error) {
        return runtimeErrorResult(error)
      }
    }
  )
}

/** Register a tool set for every table, view, and function in the schema. */
export function registerSchemaTools(
  server: McpServer,
  supabase: SupabaseClient,
  schema: ApiSchema
): void {
  for (const resource of schema.resources) {
    registerResourceTools(server, supabase, resource)
  }
  for (const rpcFunction of schema.functions) {
    registerFunctionTool(server, supabase, rpcFunction)
  }
}
