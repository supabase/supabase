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

// TEMPORARY?
export const FGA_PERMISSIONS = {
  USER: {
    ORGANIZATIONS_READ: 'organizations_read',
    ORGANIZATIONS_WRITE: 'organizations_write',
    PROJECTS_READ: 'projects_read',
    AVAILABLE_REGIONS_READ: 'available_regions_read',
    SNIPPETS_READ: 'snippets_read',
  },
  ORGANIZATION: {
    ADMIN_READ: 'organization_admin_read',
    ADMIN_WRITE: 'organization_admin_write',
    MEMBERS_READ: 'members_read',
    MEMBERS_WRITE: 'members_write',
  },
  PROJECT: {
    ADMIN_READ: 'project_admin_read',
    ADMIN_WRITE: 'project_admin_write',
    ADVISORS_READ: 'advisors_read',
    API_GATEWAY_KEYS_READ: 'api_gateway_keys_read',
    API_GATEWAY_KEYS_WRITE: 'api_gateway_keys_write',
    AUTH_CONFIG_READ: 'auth_config_read',
    AUTH_CONFIG_WRITE: 'auth_config_write',
    AUTH_SIGNING_KEYS_READ: 'auth_signing_keys_read',
    AUTH_SIGNING_KEYS_WRITE: 'auth_signing_keys_write',
    BACKUPS_READ: 'backups_read',
    BACKUPS_WRITE: 'backups_write',
    BRANCHING_DEVELOPMENT_READ: 'branching_development_read',
    BRANCHING_DEVELOPMENT_WRITE: 'branching_development_write',
    BRANCHING_PRODUCTION_READ: 'branching_production_read',
    BRANCHING_PRODUCTION_WRITE: 'branching_production_write',
    CUSTOM_DOMAIN_READ: 'custom_domain_read',
    CUSTOM_DOMAIN_WRITE: 'custom_domain_write',
    DATA_API_CONFIG_READ: 'data_api_config_read',
    DATA_API_CONFIG_WRITE: 'data_api_config_write',
    DATABASE_READ: 'database_read',
    DATABASE_WRITE: 'database_write',
    DATABASE_CONFIG_READ: 'database_config_read',
    DATABASE_CONFIG_WRITE: 'database_config_write',
    DATABASE_NETWORK_BANS_READ: 'database_network_bans_read',
    DATABASE_NETWORK_BANS_WRITE: 'database_network_bans_write',
    DATABASE_NETWORK_RESTRICTIONS_READ: 'database_network_restrictions_read',
    DATABASE_NETWORK_RESTRICTIONS_WRITE: 'database_network_restrictions_write',
    DATABASE_MIGRATIONS_READ: 'database_migrations_read',
    DATABASE_MIGRATIONS_WRITE: 'database_migrations_write',
    DATABASE_POOLING_CONFIG_READ: 'database_pooling_config_read',
    DATABASE_POOLING_CONFIG_WRITE: 'database_pooling_config_write',
    DATABASE_READONLY_CONFIG_READ: 'database_readonly_config_read',
    DATABASE_READONLY_CONFIG_WRITE: 'database_readonly_config_write',
    DATABASE_SSL_CONFIG_READ: 'database_ssl_config_read',
    DATABASE_SSL_CONFIG_WRITE: 'database_ssl_config_write',
    DATABASE_WEBHOOKS_CONFIG_READ: 'database_webhooks_config_read',
    DATABASE_WEBHOOKS_CONFIG_WRITE: 'database_webhooks_config_write',
    EDGE_FUNCTIONS_READ: 'edge_functions_read',
    EDGE_FUNCTIONS_WRITE: 'edge_functions_write',
    EDGE_FUNCTIONS_SECRETS_READ: 'edge_functions_secrets_read',
    EDGE_FUNCTIONS_SECRETS_WRITE: 'edge_functions_secrets_write',
    INFRA_ADDONS_READ: 'infra_add-ons_read',
    INFRA_ADDONS_WRITE: 'infra_add-ons_write',
    READ_REPLICAS_READ: 'infra_read_replicas_read',
    READ_REPLICAS_WRITE: 'infra_read_replicas_write',
    SNIPPETS_READ: 'project_snippets_read',
    SNIPPETS_WRITE: 'project_snippets_write',
    STORAGE_READ: 'storage_read',
    STORAGE_WRITE: 'storage_write',
    STORAGE_CONFIG_READ: 'storage_config_read',
    STORAGE_CONFIG_WRITE: 'storage_config_write',
    TELEMETRY_LOGS_READ: 'telemetry_logs_read',
    TELEMETRY_USAGE_READ: 'telemetry_usage_read',
  },
} as const

// Permission mapping function
export const mapPermissionToFGA = (resource: string, action: string): string[] => {
  // Map based on FGA_PERMISSIONS structure
  if (resource === 'organization:admin') {
    if (action === 'read') return [FGA_PERMISSIONS.ORGANIZATION.ADMIN_READ]
    if (action === 'read-write')
      return [FGA_PERMISSIONS.ORGANIZATION.ADMIN_READ, FGA_PERMISSIONS.ORGANIZATION.ADMIN_WRITE]
    if (action === 'no access') return []
  }

  if (resource === 'organization:members') {
    if (action === 'read') return [FGA_PERMISSIONS.ORGANIZATION.MEMBERS_READ]
    if (action === 'read-write')
      return [FGA_PERMISSIONS.ORGANIZATION.MEMBERS_READ, FGA_PERMISSIONS.ORGANIZATION.MEMBERS_WRITE]
    if (action === 'no access') return []
  }

  if (resource === 'project:admin') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.ADMIN_READ]
    if (action === 'read-write')
      return [FGA_PERMISSIONS.PROJECT.ADMIN_READ, FGA_PERMISSIONS.PROJECT.ADMIN_WRITE]
    if (action === 'no access') return []
  }

  if (resource === 'project:advisors') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.ADVISORS_READ]
    if (action === 'no access') return []
  }

  if (resource === 'project:api_gateway:keys') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.API_GATEWAY_KEYS_READ]
    if (action === 'read-write')
      return [
        FGA_PERMISSIONS.PROJECT.API_GATEWAY_KEYS_READ,
        FGA_PERMISSIONS.PROJECT.API_GATEWAY_KEYS_WRITE,
      ]
    if (action === 'no access') return []
  }

  if (resource === 'project:auth:config') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.AUTH_CONFIG_READ]
    if (action === 'read-write')
      return [FGA_PERMISSIONS.PROJECT.AUTH_CONFIG_READ, FGA_PERMISSIONS.PROJECT.AUTH_CONFIG_WRITE]
    if (action === 'no access') return []
  }

  if (resource === 'project:auth:signing_keys') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.AUTH_SIGNING_KEYS_READ]
    if (action === 'read-write')
      return [
        FGA_PERMISSIONS.PROJECT.AUTH_SIGNING_KEYS_READ,
        FGA_PERMISSIONS.PROJECT.AUTH_SIGNING_KEYS_WRITE,
      ]
    if (action === 'no access') return []
  }

  if (resource === 'project:backups') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.BACKUPS_READ]
    if (action === 'read-write')
      return [FGA_PERMISSIONS.PROJECT.BACKUPS_READ, FGA_PERMISSIONS.PROJECT.BACKUPS_WRITE]
    if (action === 'no access') return []
  }

  if (resource === 'project:branching:development') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_READ]
    if (action === 'read-write')
      return [
        FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_READ,
        FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_WRITE,
      ]
    if (action === 'no access') return []
  }

  if (resource === 'project:branching:production') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_READ]
    if (action === 'read-write')
      return [
        FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_READ,
        FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_WRITE,
      ]
    if (action === 'no access') return []
  }

  if (resource === 'project:custom_domain') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.CUSTOM_DOMAIN_READ]
    if (action === 'read-write')
      return [
        FGA_PERMISSIONS.PROJECT.CUSTOM_DOMAIN_READ,
        FGA_PERMISSIONS.PROJECT.CUSTOM_DOMAIN_WRITE,
      ]
    if (action === 'no access') return []
  }

  if (resource === 'project:data_api:config') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.DATA_API_CONFIG_READ]
    if (action === 'read-write')
      return [
        FGA_PERMISSIONS.PROJECT.DATA_API_CONFIG_READ,
        FGA_PERMISSIONS.PROJECT.DATA_API_CONFIG_WRITE,
      ]
    if (action === 'no access') return []
  }

  if (resource === 'project:database') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.DATABASE_READ]
    if (action === 'read-write')
      return [FGA_PERMISSIONS.PROJECT.DATABASE_READ, FGA_PERMISSIONS.PROJECT.DATABASE_WRITE]
    if (action === 'no access') return []
  }

  if (resource === 'project:database:config') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.DATABASE_CONFIG_READ]
    if (action === 'read-write')
      return [
        FGA_PERMISSIONS.PROJECT.DATABASE_CONFIG_READ,
        FGA_PERMISSIONS.PROJECT.DATABASE_CONFIG_WRITE,
      ]
    if (action === 'no access') return []
  }

  if (resource === 'project:database:network_bans') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.DATABASE_NETWORK_BANS_READ]
    if (action === 'read-write')
      return [
        FGA_PERMISSIONS.PROJECT.DATABASE_NETWORK_BANS_READ,
        FGA_PERMISSIONS.PROJECT.DATABASE_NETWORK_BANS_WRITE,
      ]
    if (action === 'no access') return []
  }

  if (resource === 'project:database:network_restrictions') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.DATABASE_NETWORK_RESTRICTIONS_READ]
    if (action === 'read-write')
      return [
        FGA_PERMISSIONS.PROJECT.DATABASE_NETWORK_RESTRICTIONS_READ,
        FGA_PERMISSIONS.PROJECT.DATABASE_NETWORK_RESTRICTIONS_WRITE,
      ]
    if (action === 'no access') return []
  }

  if (resource === 'project:database:migrations') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.DATABASE_MIGRATIONS_READ]
    if (action === 'read-write')
      return [
        FGA_PERMISSIONS.PROJECT.DATABASE_MIGRATIONS_READ,
        FGA_PERMISSIONS.PROJECT.DATABASE_MIGRATIONS_WRITE,
      ]
    if (action === 'no access') return []
  }

  if (resource === 'project:database:pooling_config') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.DATABASE_POOLING_CONFIG_READ]
    if (action === 'read-write')
      return [
        FGA_PERMISSIONS.PROJECT.DATABASE_POOLING_CONFIG_READ,
        FGA_PERMISSIONS.PROJECT.DATABASE_POOLING_CONFIG_WRITE,
      ]
    if (action === 'no access') return []
  }

  if (resource === 'project:database:readonly_config') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.DATABASE_READONLY_CONFIG_READ]
    if (action === 'read-write')
      return [
        FGA_PERMISSIONS.PROJECT.DATABASE_READONLY_CONFIG_READ,
        FGA_PERMISSIONS.PROJECT.DATABASE_READONLY_CONFIG_WRITE,
      ]
    if (action === 'no access') return []
  }

  if (resource === 'project:database:ssl_config') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.DATABASE_SSL_CONFIG_READ]
    if (action === 'read-write')
      return [
        FGA_PERMISSIONS.PROJECT.DATABASE_SSL_CONFIG_READ,
        FGA_PERMISSIONS.PROJECT.DATABASE_SSL_CONFIG_WRITE,
      ]
    if (action === 'no access') return []
  }

  if (resource === 'project:database:webhooks_config') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.DATABASE_WEBHOOKS_CONFIG_READ]
    if (action === 'read-write')
      return [
        FGA_PERMISSIONS.PROJECT.DATABASE_WEBHOOKS_CONFIG_READ,
        FGA_PERMISSIONS.PROJECT.DATABASE_WEBHOOKS_CONFIG_WRITE,
      ]
    if (action === 'no access') return []
  }

  if (resource === 'project:edge_functions') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.EDGE_FUNCTIONS_READ]
    if (action === 'read-write')
      return [
        FGA_PERMISSIONS.PROJECT.EDGE_FUNCTIONS_READ,
        FGA_PERMISSIONS.PROJECT.EDGE_FUNCTIONS_WRITE,
      ]
    if (action === 'no access') return []
  }

  if (resource === 'project:edge_functions:secrets') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.EDGE_FUNCTIONS_SECRETS_READ]
    if (action === 'read-write')
      return [
        FGA_PERMISSIONS.PROJECT.EDGE_FUNCTIONS_SECRETS_READ,
        FGA_PERMISSIONS.PROJECT.EDGE_FUNCTIONS_SECRETS_WRITE,
      ]
    if (action === 'no access') return []
  }

  if (resource === 'project:infra:add-ons') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.INFRA_ADDONS_READ]
    if (action === 'read-write')
      return [FGA_PERMISSIONS.PROJECT.INFRA_ADDONS_READ, FGA_PERMISSIONS.PROJECT.INFRA_ADDONS_WRITE]
    if (action === 'no access') return []
  }

  if (resource === 'project:infra:read_replicas') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.READ_REPLICAS_READ]
    if (action === 'read-write')
      return [
        FGA_PERMISSIONS.PROJECT.READ_REPLICAS_READ,
        FGA_PERMISSIONS.PROJECT.READ_REPLICAS_WRITE,
      ]
    if (action === 'no access') return []
  }

  if (resource === 'project:snippets') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.SNIPPETS_READ]
    if (action === 'read-write')
      return [FGA_PERMISSIONS.PROJECT.SNIPPETS_READ, FGA_PERMISSIONS.PROJECT.SNIPPETS_WRITE]
    if (action === 'no access') return []
  }

  if (resource === 'project:storage') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.STORAGE_READ]
    if (action === 'read-write')
      return [FGA_PERMISSIONS.PROJECT.STORAGE_READ, FGA_PERMISSIONS.PROJECT.STORAGE_WRITE]
    if (action === 'no access') return []
  }

  if (resource === 'project:storage:config') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.STORAGE_CONFIG_READ]
    if (action === 'read-write')
      return [
        FGA_PERMISSIONS.PROJECT.STORAGE_CONFIG_READ,
        FGA_PERMISSIONS.PROJECT.STORAGE_CONFIG_WRITE,
      ]
    if (action === 'no access') return []
  }

  if (resource === 'project:telemetry:logs') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.TELEMETRY_LOGS_READ]
    if (action === 'no access') return []
  }

  if (resource === 'project:telemetry:usage') {
    if (action === 'read') return [FGA_PERMISSIONS.PROJECT.TELEMETRY_USAGE_READ]
    if (action === 'no access') return []
  }

  // Unknown combination
  console.warn(`Unknown permission combination: ${resource}:${action}`)
  return []
}

// Convert FGA_PERMISSIONS to UI format
export const PERMISSIONS_UI = [
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
