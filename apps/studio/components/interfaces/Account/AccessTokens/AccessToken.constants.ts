import dayjs from 'dayjs'
import { components } from 'api-types'

export type ScopedAccessTokenPermission =
  components['schemas']['CreateScopedAccessTokenBody']['permissions'][number]

export const NON_EXPIRING_TOKEN_VALUE = 'never'
export const CUSTOM_EXPIRY_VALUE = 'custom'

export const EXPIRES_AT_OPTIONS = {
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
} as const

interface PermissionOption {
  id: string // e.g., 'user:organizations:read'
  title: string
  permissions: ScopedAccessTokenPermission[]
}

export const PERMISSION_OPTIONS: PermissionOption[] = [
  {
    id: 'project:action_runs:read',
    title: 'Read action runs',
    permissions: ['action_runs_read'],
  },
  {
    id: 'project:action_runs:write',
    title: 'Write action runs',
    permissions: ['action_runs_write'],
  },
  {
    id: 'project:advisors:read',
    title: 'View project advisor recommendations',
    permissions: ['advisors_read'],
  },
  {
    id: 'project:telemetry:logs:read',
    title: 'View project log analytics',
    permissions: ['analytics_logs_read'],
  },
  {
    id: 'project:telemetry:usage:read',
    title: 'Access usage analytics data',
    permissions: ['analytics_usage_read'],
  },
  {
    id: 'project:api_gateway:keys:read',
    title: 'Read API keys for the API gateway',
    permissions: ['api_gateway_keys_read'],
  },
  {
    id: 'project:api_gateway:keys:write',
    title: 'Manage API keys for the API gateway',
    permissions: ['api_gateway_keys_write'],
  },
  {
    id: 'project:auth:config:read',
    title: 'Read authentication settings',
    permissions: ['auth_config_read'],
  },
  {
    id: 'project:auth:config:write',
    title: 'Modify authentication settings',
    permissions: ['auth_config_write'],
  },
  {
    id: 'project:auth:signing_keys:read',
    title: 'Read signing keys',
    permissions: ['auth_signing_keys_read'],
  },
  {
    id: 'project:auth:signing_keys:write',
    title: 'Access or rotate signing keys',
    permissions: ['auth_signing_keys_write'],
  },
  {
    id: 'project:backups:read',
    title: 'View project backups',
    permissions: ['backups_read'],
  },
  {
    id: 'project:backups:write',
    title: 'Trigger project backups',
    permissions: ['backups_write'],
  },
  {
    id: 'project:branching:development:read',
    title: 'Read development branches',
    permissions: ['branching_development_read'],
  },
  {
    id: 'project:branching:development:write',
    title: 'Write development branches',
    permissions: ['branching_development_write'],
  },
  {
    id: 'project:branching:development:create',
    title: 'Create development branches',
    permissions: ['branching_development_create'],
  },
  {
    id: 'project:branching:development:delete',
    title: 'Delete development branches',
    permissions: ['branching_development_delete'],
  },
  {
    id: 'project:branching:production:read',
    title: 'Read production branches',
    permissions: ['branching_production_read'],
  },
  {
    id: 'project:branching:production:write',
    title: 'Write production branches',
    permissions: ['branching_production_write'],
  },
  {
    id: 'project:branching:production:create',
    title: 'Create production branches',
    permissions: ['branching_production_create'],
  },
  {
    id: 'project:branching:production:delete',
    title: 'Delete production branches',
    permissions: ['branching_production_delete'],
  },
  {
    id: 'project:custom_domain:read',
    title: 'Read custom domains',
    permissions: ['custom_domain_read'],
  },
  {
    id: 'project:custom_domain:write',
    title: 'Manage custom domains',
    permissions: ['custom_domain_write'],
  },
  {
    id: 'project:data_api:config:read',
    title: 'Read PostgREST behavior and settings',
    permissions: ['data_api_config_read'],
  },
  {
    id: 'project:data_api:config:write',
    title: 'Modify PostgREST behavior and settings',
    permissions: ['data_api_config_write'],
  },
  {
    id: 'project:database:read',
    title: 'Read database data',
    permissions: ['database_read'],
  },
  {
    id: 'project:database:write',
    title: 'Write database data',
    permissions: ['database_write'],
  },
  {
    id: 'project:database:config:read',
    title: 'Read core database configuration',
    permissions: ['database_config_read'],
  },
  {
    id: 'project:database:config:write',
    title: 'Manage core database configuration',
    permissions: ['database_config_write'],
  },
  {
    id: 'project:database:jit:read',
    title: 'Read database JIT settings',
    permissions: ['database_jit_read'],
  },
  {
    id: 'project:database:jit:write',
    title: 'Write database JIT settings',
    permissions: ['database_jit_write'],
  },
  {
    id: 'project:database:network_bans:read',
    title: 'Read banned IPs',
    permissions: ['database_network_bans_read'],
  },
  {
    id: 'project:database:network_bans:write',
    title: 'Manage banned IPs',
    permissions: ['database_network_bans_write'],
  },
  {
    id: 'project:database:network_restrictions:read',
    title: 'Read network restrictions',
    permissions: ['database_network_restrictions_read'],
  },
  {
    id: 'project:database:network_restrictions:write',
    title: 'Set or modify network restrictions',
    permissions: ['database_network_restrictions_write'],
  },
  {
    id: 'project:database:migrations:read',
    title: 'Read database migrations',
    permissions: ['database_migrations_read'],
  },
  {
    id: 'project:database:migrations:write',
    title: 'Manage database migrations',
    permissions: ['database_migrations_write'],
  },
  {
    id: 'project:database:pooling_config:read',
    title: 'Read database connection pooling',
    permissions: ['database_pooling_config_read'],
  },
  {
    id: 'project:database:pooling_config:write',
    title: 'Configure database connection pooling',
    permissions: ['database_pooling_config_write'],
  },
  {
    id: 'project:database:readonly_config:read',
    title: 'Read database read only mode',
    permissions: ['database_readonly_config_read'],
  },
  {
    id: 'project:database:readonly_config:write',
    title: 'Manage database read only mode',
    permissions: ['database_readonly_config_write'],
  },
  {
    id: 'project:database:ssl_config:read',
    title: 'Read SSL configuration',
    permissions: ['database_ssl_config_read'],
  },
  {
    id: 'project:database:ssl_config:write',
    title: 'Configure SSL for the database',
    permissions: ['database_ssl_config_write'],
  },
  {
    id: 'project:database:webhooks_config:read',
    title: 'Read webhooks triggered from the database',
    permissions: ['database_webhooks_config_read'],
  },
  {
    id: 'project:database:webhooks_config:write',
    title: 'Manage webhooks triggered from the database',
    permissions: ['database_webhooks_config_write'],
  },
  {
    id: 'project:edge_functions:read',
    title: 'Read edge functions',
    permissions: ['edge_functions_read'],
  },
  {
    id: 'project:edge_functions:write',
    title: 'Create and manage edge functions',
    permissions: ['edge_functions_write'],
  },
  {
    id: 'project:edge_functions:secrets:read',
    title: 'Read secrets for edge functions',
    permissions: ['edge_functions_secrets_read'],
  },
  {
    id: 'project:edge_functions:secrets:write',
    title: 'Manage secrets for edge functions',
    permissions: ['edge_functions_secrets_write'],
  },
  {
    id: 'project:infra:add_ons:read',
    title: 'Read project infrastructure add-ons',
    permissions: ['infra_add_ons_read'],
  },
  {
    id: 'project:infra:add_ons:write',
    title: 'Manage project infrastructure add-ons',
    permissions: ['infra_add_ons_write'],
  },
  {
    id: 'project:infra:disk_config:read',
    title: 'Read disk configuration',
    permissions: ['infra_disk_config_read'],
  },
  {
    id: 'project:infra:disk_config:write',
    title: 'Write disk configuration',
    permissions: ['infra_disk_config_write'],
  },
  {
    id: 'project:infra:read_replicas:read',
    title: 'Read read replicas configuration',
    permissions: ['infra_read_replicas_read'],
  },
  {
    id: 'project:infra:read_replicas:write',
    title: 'Configure read replicas',
    permissions: ['infra_read_replicas_write'],
  },
  {
    id: 'organization:admin:read',
    title: 'Read organization admin settings',
    permissions: ['organization_admin_read'],
  },
  {
    id: 'organization:admin:write',
    title: 'Write organization admin settings (transfer projects)',
    permissions: ['organization_admin_write'],
  },
  {
    id: 'organization:members:read',
    title: 'Read organization members',
    permissions: ['members_read'],
  },
  {
    id: 'organization:members:write',
    title: 'Manage organization members',
    permissions: ['members_write'],
  },
  {
    id: 'organization:projects:read',
    title: 'Read organization projects',
    permissions: ['organization_projects_read'],
  },
  {
    id: 'organization:projects:create',
    title: 'Create organization projects',
    permissions: ['organization_projects_create'],
  },
  {
    id: 'project:admin:read',
    title: 'Read project admin settings',
    permissions: ['project_admin_read'],
  },
  {
    id: 'project:admin:write',
    title: 'Write project admin settings',
    permissions: ['project_admin_write'],
  },
  {
    id: 'project:snippets:read',
    title: 'Read project code snippets',
    permissions: ['project_snippets_read'],
  },
  {
    id: 'project:snippets:write',
    title: 'Manage project code snippets',
    permissions: ['project_snippets_write'],
  },
  {
    id: 'project:storage:read',
    title: 'Read file storage',
    permissions: ['storage_read'],
  },
  {
    id: 'project:storage:write',
    title: 'Write file storage',
    permissions: ['storage_write'],
  },
  {
    id: 'project:storage:config:read',
    title: 'Read storage bucket configuration',
    permissions: ['storage_config_read'],
  },
  {
    id: 'project:storage:config:write',
    title: 'Manage storage bucket configuration',
    permissions: ['storage_config_write'],
  },
  {
    id: 'user:organizations:read',
    title: 'Read organization information',
    permissions: ['organizations_read'],
  },
  {
    id: 'user:organizations:create',
    title: 'Create organizations',
    permissions: ['organizations_create'],
  },
  {
    id: 'user:projects:read',
    title: 'Access to project information',
    permissions: ['projects_read'],
  },
  {
    id: 'user:snippets:read',
    title: 'Access to user snippets',
    permissions: ['snippets_read'],
  },
  {
    id: 'project:vanity_subdomain:read',
    title: 'Read vanity subdomain',
    permissions: ['vanity_subdomain_read'],
  },
  {
    id: 'project:vanity_subdomain:write',
    title: 'Write vanity subdomain',
    permissions: ['vanity_subdomain_write'],
  },
].sort((a, b) => a.title.localeCompare(b.title)) as PermissionOption[]

export const PERMISSIONS_UI = (() => {
  const resourceMap = new Map<string, { resource: string; title: string; actions: string[] }>()

  PERMISSION_OPTIONS.forEach((option) => {
    const parts = option.id.split(':')
    const scope = parts[0]
    const resourceParts = parts.slice(1, -1)
    const action = parts[parts.length - 1]

    const resourceKey = [scope, ...resourceParts].join(':')

    if (!resourceMap.has(resourceKey)) {
      resourceMap.set(resourceKey, {
        resource: resourceKey,
        title: option.title,
        actions: ['no access'],
      })
    }

    const resource = resourceMap.get(resourceKey)!
    if (!resource.actions.includes(action)) {
      resource.actions.push(action)
    }
  })

  return {
    name: 'All permissions',
    resources: Array.from(resourceMap.values()).sort((a, b) => a.title.localeCompare(b.title)),
  }
})()

export const mapPermissionToFGA = (
  resource: string,
  action: string
): ScopedAccessTokenPermission[] => {
  const optionId = `${resource}:${action}`
  const option = PERMISSION_OPTIONS.find((o) => o.id === optionId)
  return option?.permissions || []
}

export const ACCESS_TOKEN_PERMISSIONS = PERMISSIONS_UI

export const getResourcePermissions = (
  resource: string
): Record<string, ScopedAccessTokenPermission[]> => {
  const result: Record<string, ScopedAccessTokenPermission[]> = {
    'no access': [],
  }

  PERMISSION_OPTIONS.filter((option) => {
    const parts = option.id.split(':')
    const optionResource = parts.slice(0, -1).join(':')
    return optionResource === resource
  }).forEach((option) => {
    const action = option.id.split(':').pop()!
    if (!result[action]) {
      result[action] = []
    }
    result[action].push(...option.permissions)
  })

  if (result['read'] && result['write']) {
    result['read-write'] = [...result['read'], ...result['write']]
  }

  return result
}
