import { PolicyTemplate } from '../PolicyTemplates/PolicyTemplates.constants'

export interface TableColumn {
  name: string
  data_type: string
  is_nullable: boolean
  is_identity?: boolean
  is_generated?: boolean
}

export interface SmartPolicyContext {
  schema: string
  table: string
  columns: TableColumn[]
  hasUserIdColumn: boolean
  hasCreatedAtColumn: boolean
  hasUpdatedAtColumn: boolean
  hasTenantIdColumn: boolean
  hasOrganizationIdColumn: boolean
  uuidColumns: TableColumn[]
  timestampColumns: TableColumn[]
  foreignKeyColumns: TableColumn[]
}

/**
 * Analyzes table columns to determine what smart templates are available
 */
export const analyzeTableStructure = (columns: TableColumn[]): SmartPolicyContext => {
  const hasUserIdColumn = columns.some(
    (col) =>
      col.name.toLowerCase() === 'user_id' ||
      col.name.toLowerCase() === 'created_by' ||
      col.name.toLowerCase() === 'owner_id'
  )

  const hasCreatedAtColumn = columns.some(
    (col) => col.name.toLowerCase() === 'created_at' || col.name.toLowerCase() === 'created'
  )

  const hasUpdatedAtColumn = columns.some(
    (col) =>
      col.name.toLowerCase() === 'updated_at' ||
      col.name.toLowerCase() === 'modified_at' ||
      col.name.toLowerCase() === 'updated'
  )

  const hasTenantIdColumn = columns.some(
    (col) =>
      col.name.toLowerCase() === 'tenant_id' ||
      col.name.toLowerCase() === 'workspace_id' ||
      col.name.toLowerCase() === 'project_id'
  )

  const hasOrganizationIdColumn = columns.some(
    (col) =>
      col.name.toLowerCase() === 'organization_id' ||
      col.name.toLowerCase() === 'org_id' ||
      col.name.toLowerCase() === 'company_id'
  )

  const uuidColumns = columns.filter(
    (col) =>
      col.data_type.toLowerCase().includes('uuid') || col.data_type.toLowerCase().includes('guid')
  )

  const timestampColumns = columns.filter(
    (col) =>
      col.data_type.toLowerCase().includes('timestamp') ||
      col.data_type.toLowerCase().includes('date')
  )

  const foreignKeyColumns = columns.filter(
    (col) =>
      col.name.toLowerCase().endsWith('_id') &&
      !col.name.toLowerCase().includes('user') &&
      !col.name.toLowerCase().includes('tenant') &&
      !col.name.toLowerCase().includes('organization')
  )

  return {
    schema: '',
    table: '',
    columns,
    hasUserIdColumn,
    hasCreatedAtColumn,
    hasUpdatedAtColumn,
    hasTenantIdColumn,
    hasOrganizationIdColumn,
    uuidColumns,
    timestampColumns,
    foreignKeyColumns,
  }
}

/**
 * Generates smart policy templates based on table structure
 */
export const generateSmartPolicyTemplates = (
  schema: string,
  table: string,
  columns: TableColumn[]
): PolicyTemplate[] => {
  const context = analyzeTableStructure(columns)
  context.schema = schema
  context.table = table

  const templates: PolicyTemplate[] = []

  // Always include basic templates
  templates.push(
    {
      id: 'smart-policy-1',
      preview: false,
      templateName: 'Enable read access to everyone',
      description:
        'This policy gives read access to your table for all users via the SELECT operation.',
      statement: `
create policy "Enable read access for all users"
on "${schema}"."${table}"
for select using (true);`.trim(),
      name: 'Enable read access for all users',
      definition: 'true',
      check: '',
      command: 'SELECT',
      roles: [],
    },
    {
      id: 'smart-policy-2',
      preview: false,
      templateName: 'Enable insert access for authenticated users only',
      description:
        'This policy gives insert access to your table for all authenticated users only.',
      statement: `
create policy "Enable insert for authenticated users only"
on "${schema}"."${table}"
for insert to authenticated
with check (true);`.trim(),
      name: 'Enable insert for authenticated users only',
      definition: '',
      check: 'true',
      command: 'INSERT',
      roles: ['authenticated'],
    }
  )

  // User-based access templates
  if (context.hasUserIdColumn) {
    const userIdColumn =
      context.columns.find(
        (col) =>
          col.name.toLowerCase() === 'user_id' ||
          col.name.toLowerCase() === 'created_by' ||
          col.name.toLowerCase() === 'owner_id'
      )?.name || 'user_id'

    templates.push(
      {
        id: 'smart-policy-user-select',
        preview: false,
        templateName: `Allow users to view their own data (${userIdColumn})`,
        description: `Restrict users to reading only their own data using the ${userIdColumn} column.`,
        statement: `
create policy "Enable users to view their own data only"
on "${schema}"."${table}"
for select
to authenticated
using (
  (select auth.uid()) = ${userIdColumn}
);`.trim(),
        name: 'Enable users to view their own data only',
        definition: `(select auth.uid()) = ${userIdColumn}`,
        check: '',
        command: 'SELECT',
        roles: ['authenticated'],
      },
      {
        id: 'smart-policy-user-insert',
        preview: false,
        templateName: `Allow users to insert their own data (${userIdColumn})`,
        description: `Allow users to insert rows where the ${userIdColumn} column matches their ID.`,
        statement: `
create policy "Enable users to insert their own data"
on "${schema}"."${table}"
for insert
to authenticated
with check (
  (select auth.uid()) = ${userIdColumn}
);`.trim(),
        name: 'Enable users to insert their own data',
        definition: '',
        check: `(select auth.uid()) = ${userIdColumn}`,
        command: 'INSERT',
        roles: ['authenticated'],
      },
      {
        id: 'smart-policy-user-update',
        preview: false,
        templateName: `Allow users to update their own data (${userIdColumn})`,
        description: `Allow users to update rows where the ${userIdColumn} column matches their ID.`,
        statement: `
create policy "Enable users to update their own data"
on "${schema}"."${table}"
for update
to authenticated
using (
  (select auth.uid()) = ${userIdColumn}
)
with check (
  (select auth.uid()) = ${userIdColumn}
);`.trim(),
        name: 'Enable users to update their own data',
        definition: `(select auth.uid()) = ${userIdColumn}`,
        check: `(select auth.uid()) = ${userIdColumn}`,
        command: 'UPDATE',
        roles: ['authenticated'],
      },
      {
        id: 'smart-policy-user-delete',
        preview: false,
        templateName: `Allow users to delete their own data (${userIdColumn})`,
        description: `Allow users to delete rows where the ${userIdColumn} column matches their ID.`,
        statement: `
create policy "Enable users to delete their own data"
on "${schema}"."${table}"
for delete
to authenticated
using (
  (select auth.uid()) = ${userIdColumn}
);`.trim(),
        name: 'Enable users to delete their own data',
        definition: `(select auth.uid()) = ${userIdColumn}`,
        check: '',
        command: 'DELETE',
        roles: ['authenticated'],
      }
    )
  }

  // Tenant-based access templates
  if (context.hasTenantIdColumn) {
    const tenantIdColumn =
      context.columns.find(
        (col) =>
          col.name.toLowerCase() === 'tenant_id' ||
          col.name.toLowerCase() === 'workspace_id' ||
          col.name.toLowerCase() === 'project_id'
      )?.name || 'tenant_id'

    templates.push({
      id: 'smart-policy-tenant-select',
      preview: false,
      templateName: `Allow access based on tenant (${tenantIdColumn})`,
      description: `Restrict access to rows where the ${tenantIdColumn} matches the user's tenant from JWT claims.`,
      statement: `
create policy "Enable tenant-based access"
on "${schema}"."${table}"
for select
to authenticated
using (
  ${tenantIdColumn} = (auth.jwt() ->> 'app_metadata' ->> 'tenant_id')::uuid
);`.trim(),
      name: 'Enable tenant-based access',
      definition: `${tenantIdColumn} = (auth.jwt() ->> 'app_metadata' ->> 'tenant_id')::uuid`,
      check: '',
      command: 'SELECT',
      roles: ['authenticated'],
    })
  }

  // Time-based access templates
  if (context.hasCreatedAtColumn) {
    const createdAtColumn =
      context.columns.find(
        (col) => col.name.toLowerCase() === 'created_at' || col.name.toLowerCase() === 'created'
      )?.name || 'created_at'

    templates.push({
      id: 'smart-policy-time-select',
      preview: true,
      templateName: `Time-based access (${createdAtColumn})`,
      description: `Implement TTL-like feature where rows are available only if created within the last 24 hours.`,
      statement: `
create policy "Stories are live for a day"
on "${schema}"."${table}"
for select using (
  ${createdAtColumn} > (current_timestamp - interval '1 day')
);`.trim(),
      name: 'Stories are live for a day',
      definition: `${createdAtColumn} > (current_timestamp - interval '1 day')`,
      check: '',
      command: 'SELECT',
      roles: [],
    })
  }

  // Role-based access templates
  templates.push({
    id: 'smart-policy-role-admin',
    preview: true,
    templateName: 'Admin-only access',
    description: `Restrict access to users with 'admin' role in JWT claims.`,
    statement: `
create policy "Admin-only access"
on "${schema}"."${table}"
for all
to authenticated
using (
  (auth.jwt() ->> 'app_metadata' ->> 'role') = 'admin'
);`.trim(),
    name: 'Admin-only access',
    definition: `(auth.jwt() ->> 'app_metadata' ->> 'role') = 'admin'`,
    check: `(auth.jwt() ->> 'app_metadata' ->> 'role') = 'admin'`,
    command: 'ALL',
    roles: ['authenticated'],
  })

  // Multi-column access templates
  if (context.hasUserIdColumn && context.hasTenantIdColumn) {
    const userIdColumn =
      context.columns.find(
        (col) =>
          col.name.toLowerCase() === 'user_id' ||
          col.name.toLowerCase() === 'created_by' ||
          col.name.toLowerCase() === 'owner_id'
      )?.name || 'user_id'

    const tenantIdColumn =
      context.columns.find(
        (col) =>
          col.name.toLowerCase() === 'tenant_id' ||
          col.name.toLowerCase() === 'workspace_id' ||
          col.name.toLowerCase() === 'project_id'
      )?.name || 'tenant_id'

    templates.push({
      id: 'smart-policy-multi-column',
      preview: true,
      templateName: `Multi-tenant user access (${userIdColumn} + ${tenantIdColumn})`,
      description: `Restrict access to users within the same tenant, allowing them to see their own data and potentially other users' data within the same tenant.`,
      statement: `
create policy "Multi-tenant user access"
on "${schema}"."${table}"
for select
to authenticated
using (
  ${tenantIdColumn} = (auth.jwt() ->> 'app_metadata' ->> 'tenant_id')::uuid
  AND (
    ${userIdColumn} = auth.uid()
    OR (auth.jwt() ->> 'app_metadata' ->> 'role') = 'admin'
  )
);`.trim(),
      name: 'Multi-tenant user access',
      definition: `${tenantIdColumn} = (auth.jwt() ->> 'app_metadata' ->> 'tenant_id')::uuid AND (${userIdColumn} = auth.uid() OR (auth.jwt() ->> 'app_metadata' ->> 'role') = 'admin')`,
      check: '',
      command: 'SELECT',
      roles: ['authenticated'],
    })
  }

  return templates
}

/**
 * Generates contextual base queries for SQL editor
 */
export const generateContextualBaseQueries = (
  schema: string,
  table: string,
  columns: TableColumn[],
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
): string[] => {
  const context = analyzeTableStructure(columns)
  const baseQueries: string[] = []

  // Always include basic queries
  baseQueries.push('true')
  baseQueries.push('false')

  // User-based queries
  if (context.hasUserIdColumn) {
    const userIdColumn =
      context.columns.find(
        (col) =>
          col.name.toLowerCase() === 'user_id' ||
          col.name.toLowerCase() === 'created_by' ||
          col.name.toLowerCase() === 'owner_id'
      )?.name || 'user_id'

    baseQueries.push(`(select auth.uid()) = ${userIdColumn}`)
    baseQueries.push(`(select auth.uid()) != ${userIdColumn}`)
  }

  // Tenant-based queries
  if (context.hasTenantIdColumn) {
    const tenantIdColumn =
      context.columns.find(
        (col) =>
          col.name.toLowerCase() === 'tenant_id' ||
          col.name.toLowerCase() === 'workspace_id' ||
          col.name.toLowerCase() === 'project_id'
      )?.name || 'tenant_id'

    baseQueries.push(`${tenantIdColumn} = (auth.jwt() ->> 'app_metadata' ->> 'tenant_id')::uuid`)
  }

  // Role-based queries
  baseQueries.push(`(auth.jwt() ->> 'app_metadata' ->> 'role') = 'admin'`)
  baseQueries.push(`(auth.jwt() ->> 'app_metadata' ->> 'role') = 'user'`)
  baseQueries.push(`(auth.jwt() ->> 'app_metadata' ->> 'role') IN ('admin', 'moderator')`)

  // Time-based queries
  if (context.hasCreatedAtColumn) {
    const createdAtColumn =
      context.columns.find(
        (col) => col.name.toLowerCase() === 'created_at' || col.name.toLowerCase() === 'created'
      )?.name || 'created_at'

    baseQueries.push(`${createdAtColumn} > (current_timestamp - interval '1 day')`)
    baseQueries.push(`${createdAtColumn} > (current_timestamp - interval '1 week')`)
    baseQueries.push(`${createdAtColumn} > (current_timestamp - interval '1 month')`)
  }

  // Status-based queries (common patterns)
  const statusColumns = columns.filter(
    (col) =>
      col.name.toLowerCase().includes('status') ||
      col.name.toLowerCase().includes('state') ||
      col.name.toLowerCase().includes('active')
  )

  statusColumns.forEach((col) => {
    baseQueries.push(`${col.name} = 'active'`)
    baseQueries.push(`${col.name} = 'published'`)
    baseQueries.push(`${col.name} IN ('active', 'published')`)
  })

  // Boolean column queries
  const booleanColumns = columns.filter((col) => col.data_type.toLowerCase().includes('boolean'))

  booleanColumns.forEach((col) => {
    baseQueries.push(`${col.name} = true`)
    baseQueries.push(`${col.name} = false`)
  })

  return baseQueries
}
