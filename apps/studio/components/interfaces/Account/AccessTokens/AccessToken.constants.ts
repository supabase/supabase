import dayjs from 'dayjs'
import { components } from 'api-types'

type ScopedAccessTokenPermission =
  components['schemas']['CreateScopedAccessTokenBody']['permissions'][number]

export const NON_EXPIRING_TOKEN_VALUE = 'never'
export const CUSTOM_EXPIRY_VALUE = 'custom'

export const ExpiresAtOptions: Record<string, { value: string; label: string }> = {
  hour: {
    value: dayjs().add(1, 'hour').toISOString(),
    label: '1 hour',
  },
  day: {
    value: dayjs().add(1, 'days').toISOString(),
    label: '1 day',
  },
  week: {
    value: dayjs().add(7, 'days').toISOString(),
    label: '7 days',
  },
  month: {
    value: dayjs().add(30, 'days').toISOString(),
    label: '30 days',
  },
  never: {
    value: NON_EXPIRING_TOKEN_VALUE,
    label: 'Never',
  },
  custom: {
    value: CUSTOM_EXPIRY_VALUE,
    label: 'Custom',
  },
}

type ResourceAction = 'read' | 'write'
type AccessLevel = 'read' | 'read-write' | 'no access'

interface ResourceConfig {
  scope: 'user' | 'organization' | 'project'
  title: string
  basePermission: string
  actions: ResourceAction[]
}

// [kemal]: I don't necessarily like this approach, happy to hear a better one.
const RESOURCE_CONFIGS: Record<string, ResourceConfig> = {
  'user:organizations': {
    scope: 'user',
    title: 'Access to organization information',
    basePermission: 'organizations',
    actions: ['read', 'write'],
  },
  'user:projects': {
    scope: 'user',
    title: 'Access to project information',
    basePermission: 'projects',
    actions: ['read'],
  },
  'user:available_regions': {
    scope: 'user',
    title: 'Access to available regions information',
    basePermission: 'available_regions',
    actions: ['read'],
  },
  'user:snippets': {
    scope: 'user',
    title: 'Access to user snippets',
    basePermission: 'snippets',
    actions: ['read'],
  },
  'organization:admin': {
    scope: 'organization',
    title: 'Manage organization admin settings',
    basePermission: 'organization_admin',
    actions: ['read', 'write'],
  },
  'organization:members': {
    scope: 'organization',
    title: 'Manage organization members',
    basePermission: 'members',
    actions: ['read', 'write'],
  },
  'project:admin': {
    scope: 'project',
    title: 'Full access to project admin settings',
    basePermission: 'project_admin',
    actions: ['read', 'write'],
  },
  'project:advisors': {
    scope: 'project',
    title: 'View project advisor recommendations',
    basePermission: 'advisors',
    actions: ['read'],
  },
  'project:api_gateway:keys': {
    scope: 'project',
    title: 'Manage API keys for the API gateway',
    basePermission: 'api_gateway_keys',
    actions: ['read', 'write'],
  },
  'project:auth:config': {
    scope: 'project',
    title: 'View or modify authentication settings',
    basePermission: 'auth_config',
    actions: ['read', 'write'],
  },
  'project:auth:signing_keys': {
    scope: 'project',
    title: 'Access or rotate signing keys',
    basePermission: 'auth_signing_keys',
    actions: ['read', 'write'],
  },
  'project:backups': {
    scope: 'project',
    title: 'View or trigger project backups',
    basePermission: 'backups',
    actions: ['read', 'write'],
  },
  'project:branching:development': {
    scope: 'project',
    title: 'Manage development branches',
    basePermission: 'branching_development',
    actions: ['read', 'write'],
  },
  'project:branching:production': {
    scope: 'project',
    title: 'Manage production branches',
    basePermission: 'branching_production',
    actions: ['read', 'write'],
  },
  'project:custom_domain': {
    scope: 'project',
    title: 'Manage custom domains',
    basePermission: 'custom_domain',
    actions: ['read', 'write'],
  },
  'project:data_api:config': {
    scope: 'project',
    title: 'Modify PostgREST behavior and settings',
    basePermission: 'data_api_config',
    actions: ['read', 'write'],
  },
  'project:database': {
    scope: 'project',
    title: 'Read and write access to database data',
    basePermission: 'database',
    actions: ['read', 'write'],
  },
  'project:database:config': {
    scope: 'project',
    title: 'Manage core database configuration',
    basePermission: 'database_config',
    actions: ['read', 'write'],
  },
  'project:database:network_bans': {
    scope: 'project',
    title: 'Manage banned IPs',
    basePermission: 'database_network_bans',
    actions: ['read', 'write'],
  },
  'project:database:network_restrictions': {
    scope: 'project',
    title: 'Set or modify network restrictions',
    basePermission: 'database_network_restrictions',
    actions: ['read', 'write'],
  },
  'project:database:migrations': {
    scope: 'project',
    title: 'Manage database migrations',
    basePermission: 'database_migrations',
    actions: ['read', 'write'],
  },
  'project:database:pooling_config': {
    scope: 'project',
    title: 'Configure database connection pooling',
    basePermission: 'database_pooling_config',
    actions: ['read', 'write'],
  },
  'project:database:readonly_config': {
    scope: 'project',
    title: 'Manage database read only mode',
    basePermission: 'database_readonly_config',
    actions: ['read', 'write'],
  },
  'project:database:ssl_config': {
    scope: 'project',
    title: 'Configure SSL for the database',
    basePermission: 'database_ssl_config',
    actions: ['read', 'write'],
  },
  'project:database:webhooks_config': {
    scope: 'project',
    title: 'Manage webhooks triggered from the database',
    basePermission: 'database_webhooks_config',
    actions: ['read', 'write'],
  },
  'project:edge_functions': {
    scope: 'project',
    title: 'Create and manage edge functions',
    basePermission: 'edge_functions',
    actions: ['read', 'write'],
  },
  'project:edge_functions:secrets': {
    scope: 'project',
    title: 'Manage secrets for edge functions',
    basePermission: 'edge_functions_secrets',
    actions: ['read', 'write'],
  },
  'project:infra:add-ons': {
    scope: 'project',
    title: 'Manage project infrastructure add-ons',
    basePermission: 'infra_add-ons',
    actions: ['read', 'write'],
  },
  'project:infra:read_replicas': {
    scope: 'project',
    title: 'Configure read replicas',
    basePermission: 'infra_read_replicas',
    actions: ['read', 'write'],
  },
  'project:snippets': {
    scope: 'project',
    title: 'Manage project code snippets',
    basePermission: 'project_snippets',
    actions: ['read', 'write'],
  },
  'project:storage': {
    scope: 'project',
    title: 'Read and write access to file storage',
    basePermission: 'storage',
    actions: ['read', 'write'],
  },
  'project:storage:config': {
    scope: 'project',
    title: 'Manage storage bucket configuration',
    basePermission: 'storage_config',
    actions: ['read', 'write'],
  },
  'project:telemetry:logs': {
    scope: 'project',
    title: 'View project log analytics',
    basePermission: 'telemetry_logs',
    actions: ['read'],
  },
  'project:telemetry:usage': {
    scope: 'project',
    title: 'Access usage analytics data',
    basePermission: 'telemetry_usage',
    actions: ['read'],
  },
}

function getPermissions(
  basePermission: string,
  action: ResourceAction
): ScopedAccessTokenPermission[] {
  const permissionString = `${basePermission}_${action}` as ScopedAccessTokenPermission
  return [permissionString]
}

export const PERMISSION_MAP: Record<
  string,
  Record<string, ScopedAccessTokenPermission[]>
> = Object.entries(RESOURCE_CONFIGS).reduce(
  (acc, [resourceKey, config]) => {
    const hasRead = config.actions.includes('read')
    const hasWrite = config.actions.includes('write')

    acc[resourceKey] = {
      'no access': [],
    }

    if (hasRead) {
      acc[resourceKey].read = getPermissions(config.basePermission, 'read')
    }

    if (hasRead && hasWrite) {
      acc[resourceKey]['read-write'] = [
        ...getPermissions(config.basePermission, 'read'),
        ...getPermissions(config.basePermission, 'write'),
      ]
    }

    return acc
  },
  {} as Record<string, Record<string, ScopedAccessTokenPermission[]>>
)

export const PERMISSIONS_UI = [
  {
    name: 'User permissions',
    resources: Object.entries(RESOURCE_CONFIGS)
      .filter(([_, config]) => config.scope === 'user')
      .map(([resource, config]) => {
        const actions: AccessLevel[] = ['no access']
        if (config.actions.includes('read')) {
          actions.unshift('read')
        }
        if (config.actions.includes('read') && config.actions.includes('write')) {
          actions.unshift('read-write')
        }
        return {
          resource,
          title: config.title,
          actions,
        }
      }),
  },
  {
    name: 'Organization permissions',
    resources: Object.entries(RESOURCE_CONFIGS)
      .filter(([_, config]) => config.scope === 'organization')
      .map(([resource, config]) => {
        const actions: AccessLevel[] = ['no access']
        if (config.actions.includes('read')) {
          actions.unshift('read')
        }
        if (config.actions.includes('read') && config.actions.includes('write')) {
          actions.unshift('read-write')
        }
        return {
          resource,
          title: config.title,
          actions,
        }
      }),
  },
  {
    name: 'Project permissions',
    resources: Object.entries(RESOURCE_CONFIGS)
      .filter(([_, config]) => config.scope === 'project')
      .map(([resource, config]) => {
        const actions: AccessLevel[] = ['no access']
        if (config.actions.includes('read')) {
          actions.unshift('read')
        }
        if (config.actions.includes('read') && config.actions.includes('write')) {
          actions.unshift('read-write')
        }
        return {
          resource,
          title: config.title,
          actions,
        }
      }),
  },
]

export const ACCESS_TOKEN_PERMISSIONS = PERMISSIONS_UI

export const mapPermissionToFGA = (
  resource: string,
  action: string
): ScopedAccessTokenPermission[] => {
  return PERMISSION_MAP[resource]?.[action] || []
}
