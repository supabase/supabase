import dayjs from 'dayjs'

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

// Simple direct mapping from resource-action to permission strings
export const PERMISSION_MAP: Record<string, Record<string, string[]>> = {
  'user:organizations': {
    read: ['organizations_read'],
    'read-write': ['organizations_read', 'organizations_write'],
    'no access': [],
  },
  'user:projects': {
    read: ['projects_read'],
    'no access': [],
  },
  'user:available_regions': {
    read: ['available_regions_read'],
    'no access': [],
  },
  'user:snippets': {
    read: ['snippets_read'],
    'no access': [],
  },
  'organization:admin': {
    read: ['organization_admin_read'],
    'read-write': ['organization_admin_read', 'organization_admin_write'],
    'no access': [],
  },
  'organization:members': {
    read: ['members_read'],
    'read-write': ['members_read', 'members_write'],
    'no access': [],
  },
  'project:admin': {
    read: ['project_admin_read'],
    'read-write': ['project_admin_read', 'project_admin_write'],
    'no access': [],
  },
  'project:advisors': {
    read: ['advisors_read'],
    'no access': [],
  },
  'project:api_gateway:keys': {
    read: ['api_gateway_keys_read'],
    'read-write': ['api_gateway_keys_read', 'api_gateway_keys_write'],
    'no access': [],
  },
  'project:auth:config': {
    read: ['auth_config_read'],
    'read-write': ['auth_config_read', 'auth_config_write'],
    'no access': [],
  },
  'project:auth:signing_keys': {
    read: ['auth_signing_keys_read'],
    'read-write': ['auth_signing_keys_read', 'auth_signing_keys_write'],
    'no access': [],
  },
  'project:backups': {
    read: ['backups_read'],
    'read-write': ['backups_read', 'backups_write'],
    'no access': [],
  },
  'project:branching:development': {
    read: ['branching_development_read'],
    'read-write': ['branching_development_read', 'branching_development_write'],
    'no access': [],
  },
  'project:branching:production': {
    read: ['branching_production_read'],
    'read-write': ['branching_production_read', 'branching_production_write'],
    'no access': [],
  },
  'project:custom_domain': {
    read: ['custom_domain_read'],
    'read-write': ['custom_domain_read', 'custom_domain_write'],
    'no access': [],
  },
  'project:data_api:config': {
    read: ['data_api_config_read'],
    'read-write': ['data_api_config_read', 'data_api_config_write'],
    'no access': [],
  },
  'project:database': {
    read: ['database_read'],
    'read-write': ['database_read', 'database_write'],
    'no access': [],
  },
  'project:database:config': {
    read: ['database_config_read'],
    'read-write': ['database_config_read', 'database_config_write'],
    'no access': [],
  },
  'project:database:network_bans': {
    read: ['database_network_bans_read'],
    'read-write': ['database_network_bans_read', 'database_network_bans_write'],
    'no access': [],
  },
  'project:database:network_restrictions': {
    read: ['database_network_restrictions_read'],
    'read-write': ['database_network_restrictions_read', 'database_network_restrictions_write'],
    'no access': [],
  },
  'project:database:migrations': {
    read: ['database_migrations_read'],
    'read-write': ['database_migrations_read', 'database_migrations_write'],
    'no access': [],
  },
  'project:database:pooling_config': {
    read: ['database_pooling_config_read'],
    'read-write': ['database_pooling_config_read', 'database_pooling_config_write'],
    'no access': [],
  },
  'project:database:readonly_config': {
    read: ['database_readonly_config_read'],
    'read-write': ['database_readonly_config_read', 'database_readonly_config_write'],
    'no access': [],
  },
  'project:database:ssl_config': {
    read: ['database_ssl_config_read'],
    'read-write': ['database_ssl_config_read', 'database_ssl_config_write'],
    'no access': [],
  },
  'project:database:webhooks_config': {
    read: ['database_webhooks_config_read'],
    'read-write': ['database_webhooks_config_read', 'database_webhooks_config_write'],
    'no access': [],
  },
  'project:edge_functions': {
    read: ['edge_functions_read'],
    'read-write': ['edge_functions_read', 'edge_functions_write'],
    'no access': [],
  },
  'project:edge_functions:secrets': {
    read: ['edge_functions_secrets_read'],
    'read-write': ['edge_functions_secrets_read', 'edge_functions_secrets_write'],
    'no access': [],
  },
  'project:infra:add-ons': {
    read: ['infra_add-ons_read'],
    'read-write': ['infra_add-ons_read', 'infra_add-ons_write'],
    'no access': [],
  },
  'project:infra:read_replicas': {
    read: ['infra_read_replicas_read'],
    'read-write': ['infra_read_replicas_read', 'infra_read_replicas_write'],
    'no access': [],
  },
  'project:snippets': {
    read: ['project_snippets_read'],
    'read-write': ['project_snippets_read', 'project_snippets_write'],
    'no access': [],
  },
  'project:storage': {
    read: ['storage_read'],
    'read-write': ['storage_read', 'storage_write'],
    'no access': [],
  },
  'project:storage:config': {
    read: ['storage_config_read'],
    'read-write': ['storage_config_read', 'storage_config_write'],
    'no access': [],
  },
  'project:telemetry:logs': {
    read: ['telemetry_logs_read'],
    'no access': [],
  },
  'project:telemetry:usage': {
    read: ['telemetry_usage_read'],
    'no access': [],
  },
}

// Simple mapping function
export const mapPermissionToFGA = (resource: string, action: string): string[] => {
  return PERMISSION_MAP[resource]?.[action] || []
}

// Convert PERMISSION_MAP to UI format
export const PERMISSIONS_UI = [
  {
    name: 'User permissions',
    resources: [
      {
        resource: 'user:organizations',
        title: 'Access to organization information',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'user:projects',
        title: 'Access to project information',
        actions: ['read', 'no access'],
      },
      {
        resource: 'user:available_regions',
        title: 'Access to available regions information',
        actions: ['read', 'no access'],
      },
      {
        resource: 'user:snippets',
        title: 'Access to user snippets',
        actions: ['read', 'no access'],
      },
    ],
  },
  {
    name: 'Organization permissions',
    resources: [
      {
        resource: 'organization:admin',
        title: 'Manage organization admin settings',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'organization:members',
        title: 'Manage organization members',
        actions: ['read', 'read-write', 'no access'],
      },
    ],
  },
  {
    name: 'Project permissions',
    resources: [
      {
        resource: 'project:admin',
        title: 'Full access to project admin settings',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:advisors',
        title: 'View project advisor recommendations',
        actions: ['read', 'no access'],
      },
      {
        resource: 'project:api_gateway:keys',
        title: 'Manage API keys for the API gateway',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:auth:config',
        title: 'View or modify authentication settings',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:auth:signing_keys',
        title: 'Access or rotate signing keys',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:backups',
        title: 'View or trigger project backups',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:branching:development',
        title: 'Manage development branches',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:branching:production',
        title: 'Manage production branches',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:custom_domain',
        title: 'Manage custom domains',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:data_api:config',
        title: 'Modify PostgREST behavior and settings',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:database',
        title: 'Read and write access to database data',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:database:config',
        title: 'Manage core database configuration',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:database:network_bans',
        title: 'Manage banned IPs',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:database:network_restrictions',
        title: 'Set or modify network restrictions',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:database:migrations',
        title: 'Manage database migrations',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:database:pooling_config',
        title: 'Configure database connection pooling',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:database:readonly_config',
        title: 'Manage database read only mode',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:database:ssl_config',
        title: 'Configure SSL for the database',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:database:webhooks_config',
        title: 'Manage webhooks triggered from the database',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:edge_functions',
        title: 'Create and manage edge functions',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:edge_functions:secrets',
        title: 'Manage secrets for edge functions',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:infra:add-ons',
        title: 'Manage project infrastructure add-ons',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:infra:read_replicas',
        title: 'Configure read replicas',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:snippets',
        title: 'Manage project code snippets',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:storage',
        title: 'Read and write access to file storage',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:storage:config',
        title: 'Manage storage bucket configuration',
        actions: ['read', 'read-write', 'no access'],
      },
      {
        resource: 'project:telemetry:logs',
        title: 'View project log analytics',
        actions: ['read', 'no access'],
      },
      {
        resource: 'project:telemetry:usage',
        title: 'Access usage analytics data',
        actions: ['read', 'no access'],
      },
    ],
  },
]

export const ACCESS_TOKEN_PERMISSIONS = PERMISSIONS_UI
