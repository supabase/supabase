import { executeQuery } from './query'
import { assertSelfHosted } from './util'
import { PROJECT_ENDPOINT, PROJECT_ENDPOINT_PROTOCOL } from 'lib/constants/api'
import crypto from 'crypto'

export interface Project {
  id: number
  ref: string
  name: string
  organization_id: number
  status: string
  region: string
  cloud_provider: string
  db_host: string
  db_port: number
  db_name: string
  db_schema: string
  pooler_tenant_id: string
  storage_tenant_id: string
  jwt_secret: string | null
  anon_key: string | null
  service_key: string | null
  created_at: string
  updated_at: string
}

export interface Organization {
  id: number
  name: string
  slug: string
  created_at: string
  updated_at: string
}

export interface CreateProjectInput {
  name: string
  organization_id: number
  db_name?: string
  region?: string
}

export interface CreateOrganizationInput {
  name: string
  slug?: string
}

/**
 * Generates a random project reference
 */
function generateProjectRef(): string {
  return crypto.randomBytes(10).toString('hex').substring(0, 20)
}

/**
 * Generates a slug from a name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Gets all organizations
 */
export async function getOrganizations(): Promise<Organization[]> {
  assertSelfHosted()

  const query = `
    SELECT id, name, slug, created_at, updated_at
    FROM _supabase._multi_tenant.organizations
    ORDER BY id ASC
  `

  const result = await executeQuery<Organization>({ query })
  if (result.error) {
    console.error('Error fetching organizations:', result.error)
    return []
  }

  return result.data || []
}

/**
 * Gets an organization by slug
 */
export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  assertSelfHosted()

  const query = `
    SELECT id, name, slug, created_at, updated_at
    FROM _supabase._multi_tenant.organizations
    WHERE slug = $1
  `

  const result = await executeQuery<Organization>({ query, parameters: [slug] })
  if (result.error || !result.data || result.data.length === 0) {
    return null
  }

  return result.data[0]
}

/**
 * Creates a new organization
 */
export async function createOrganization(input: CreateOrganizationInput): Promise<Organization | null> {
  assertSelfHosted()

  const slug = input.slug || generateSlug(input.name)

  const query = `
    INSERT INTO _supabase._multi_tenant.organizations (name, slug)
    VALUES ($1, $2)
    RETURNING id, name, slug, created_at, updated_at
  `

  const result = await executeQuery<Organization>({ query, parameters: [input.name, slug] })
  if (result.error || !result.data || result.data.length === 0) {
    console.error('Error creating organization:', result.error)
    return null
  }

  return result.data[0]
}

/**
 * Gets all projects
 */
export async function getProjects(): Promise<Project[]> {
  assertSelfHosted()

  const query = `
    SELECT id, ref, name, organization_id, status, region, cloud_provider,
           db_host, db_port, db_name, db_schema, pooler_tenant_id, storage_tenant_id,
           jwt_secret, anon_key, service_key, created_at, updated_at
    FROM _supabase._multi_tenant.projects
    ORDER BY id ASC
  `

  const result = await executeQuery<Project>({ query })
  if (result.error) {
    console.error('Error fetching projects:', result.error)
    return []
  }

  return result.data || []
}

/**
 * Gets projects by organization ID
 */
export async function getProjectsByOrganization(organizationId: number): Promise<Project[]> {
  assertSelfHosted()

  const query = `
    SELECT id, ref, name, organization_id, status, region, cloud_provider,
           db_host, db_port, db_name, db_schema, pooler_tenant_id, storage_tenant_id,
           jwt_secret, anon_key, service_key, created_at, updated_at
    FROM _supabase._multi_tenant.projects
    WHERE organization_id = $1
    ORDER BY id ASC
  `

  const result = await executeQuery<Project>({ query, parameters: [organizationId] })
  if (result.error) {
    console.error('Error fetching projects:', result.error)
    return []
  }

  return result.data || []
}

/**
 * Gets a project by its reference
 */
export async function getProjectByRef(ref: string): Promise<Project | null> {
  assertSelfHosted()

  const query = `
    SELECT id, ref, name, organization_id, status, region, cloud_provider,
           db_host, db_port, db_name, db_schema, pooler_tenant_id, storage_tenant_id,
           jwt_secret, anon_key, service_key, created_at, updated_at
    FROM _supabase._multi_tenant.projects
    WHERE ref = $1
  `

  const result = await executeQuery<Project>({ query, parameters: [ref] })
  if (result.error || !result.data || result.data.length === 0) {
    return null
  }

  return result.data[0]
}

/**
 * Creates a new project
 */
export async function createProject(input: CreateProjectInput): Promise<Project | null> {
  assertSelfHosted()

  const ref = generateProjectRef()
  const dbName = input.db_name || `project_${ref}`
  const region = input.region || 'local'
  const poolerTenantId = ref
  const storageTenantId = ref

  // Use environment JWT secret or generate one
  const jwtSecret = process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || null
  const anonKey = process.env.SUPABASE_ANON_KEY || null
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || null

  const query = `
    INSERT INTO _supabase._multi_tenant.projects
    (ref, name, organization_id, db_name, region, pooler_tenant_id, storage_tenant_id, jwt_secret, anon_key, service_key)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, ref, name, organization_id, status, region, cloud_provider,
              db_host, db_port, db_name, db_schema, pooler_tenant_id, storage_tenant_id,
              jwt_secret, anon_key, service_key, created_at, updated_at
  `

  const result = await executeQuery<Project>({
    query,
    parameters: [ref, input.name, input.organization_id, dbName, region, poolerTenantId, storageTenantId, jwtSecret, anonKey, serviceKey],
  })

  if (result.error || !result.data || result.data.length === 0) {
    console.error('Error creating project:', result.error)
    return null
  }

  return result.data[0]
}

/**
 * Updates a project
 */
export async function updateProject(ref: string, updates: Partial<Project>): Promise<Project | null> {
  assertSelfHosted()

  const allowedFields = ['name', 'status', 'region', 'db_schema']
  const setClause: string[] = []
  const values: unknown[] = []
  let paramIndex = 1

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      setClause.push(`${key} = $${paramIndex}`)
      values.push(value)
      paramIndex++
    }
  }

  if (setClause.length === 0) {
    return getProjectByRef(ref)
  }

  values.push(ref)

  const query = `
    UPDATE _supabase._multi_tenant.projects
    SET ${setClause.join(', ')}
    WHERE ref = $${paramIndex}
    RETURNING id, ref, name, organization_id, status, region, cloud_provider,
              db_host, db_port, db_name, db_schema, pooler_tenant_id, storage_tenant_id,
              jwt_secret, anon_key, service_key, created_at, updated_at
  `

  const result = await executeQuery<Project>({ query, parameters: values })
  if (result.error || !result.data || result.data.length === 0) {
    console.error('Error updating project:', result.error)
    return null
  }

  return result.data[0]
}

/**
 * Deletes a project
 */
export async function deleteProject(ref: string): Promise<boolean> {
  assertSelfHosted()

  const query = `
    DELETE FROM _supabase._multi_tenant.projects
    WHERE ref = $1
    RETURNING id
  `

  const result = await executeQuery<{ id: number }>({ query, parameters: [ref] })
  if (result.error) {
    console.error('Error deleting project:', result.error)
    return false
  }

  return (result.data?.length ?? 0) > 0
}

/**
 * Converts a Project to the format expected by the Studio frontend
 */
export function projectToApiFormat(project: Project) {
  return {
    id: project.id,
    ref: project.ref,
    name: project.name,
    organization_id: project.organization_id,
    cloud_provider: project.cloud_provider,
    status: project.status,
    region: project.region,
    inserted_at: project.created_at,
  }
}

/**
 * Gets project settings for a specific project
 */
export function getProjectSettingsForProject(project: Project) {
  assertSelfHosted()

  return {
    app_config: {
      db_schema: project.db_schema || 'public',
      endpoint: PROJECT_ENDPOINT,
      storage_endpoint: PROJECT_ENDPOINT,
      protocol: PROJECT_ENDPOINT_PROTOCOL,
    },
    cloud_provider: 'AWS',
    db_dns_name: '-',
    db_host: project.db_host || 'localhost',
    db_ip_addr_config: 'legacy' as const,
    db_name: project.db_name || 'postgres',
    db_port: project.db_port || 5432,
    db_user: 'postgres',
    inserted_at: project.created_at,
    jwt_secret: project.jwt_secret || process.env.AUTH_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long',
    name: project.name,
    ref: project.ref,
    region: project.region || 'local',
    service_api_keys: [
      {
        api_key: project.service_key || process.env.SUPABASE_SERVICE_KEY || '',
        name: 'service_role key',
        tags: 'service_role',
      },
      {
        api_key: project.anon_key || process.env.SUPABASE_ANON_KEY || '',
        name: 'anon key',
        tags: 'anon',
      },
    ],
    ssl_enforced: false,
    status: project.status,
  }
}
