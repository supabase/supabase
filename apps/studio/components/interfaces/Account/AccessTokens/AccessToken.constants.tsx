// A set of constants for the initial prototype of scoped PAT's.

export const ACCESS_TOKEN_EXPIRY = ['No expiry', '7 days', '30 days', '90 days', '180 days', 'Custom']

export const ACCESS_TOKEN_PERMISSIONS = [
  {
    name: 'Organization permissions',
    resources: [
      {
        resource: 'organization:admin:read/write',
        title: 'Manage organization admin settings',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'organization:members:read/write',
        title: 'Manage organization members',
        actions: ['read only', 'read-write', 'no access'],
      },
    ],
  },
  {
    name: 'Project permissions',
    resources: [
      {
        resource: 'project:admin:read/write',
        title: 'Full access to project admin settings',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:advisors:read',
        title: 'View project advisor recommendations',
        actions: ['read only', 'no access'],
      },
      {
        resource: 'project:api_gateway:keys:read/write',
        title: 'Manage API keys for the API gateway',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:auth:config:read/write',
        title: 'View or modify authentication settings',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:auth:signing_keys:read/write',
        title: 'Access or rotate signing keys',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:backups:read/write',
        title: 'View or trigger project backups',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:branching:development:read/write',
        title: 'Manage development branches',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:branching:production:read/write',
        title: 'Manage production branches',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:custom_domain:read/write',
        title: 'Manage custom domains',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:data_api:config:read/write',
        title: 'Modify PostgREST behavior and settings',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:database:read/write',
        title: 'Read and write access to database data',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:database:config:read/write',
        title: 'Manage core database configuration',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:database:network_bans:read/write',
        title: 'Manage banned IPs',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:database:network_restrictions:read/write',
        title: 'Set or modify network restrictions',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:database:migrations:read/write',
        title: 'Manage database migrations',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:database:pooling_config:read/write',
        title: 'Configure database connection pooling',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:database:readonly_config:read/write',
        title: 'Manage database read only mode',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:database:ssl_config:read/write',
        title: 'Configure SSL for the database',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:database:webhooks_config:read/write',
        title: 'Manage webhooks triggered from the database',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:edge_functions:read/write',
        title: 'Create and manage edge functions',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:edge_functions:secrets:read/write',
        title: 'Manage secrets for edge functions',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:infra:add-ons:read/write',
        title: 'Manage project infrastructure add-ons',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:infra:read_replicas:read/write',
        title: 'Configure read replicas',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:snippets:read/write',
        title: 'Manage project code snippets',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:storage:read/write',
        title: 'Read and write access to file storage',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:storage:config:read/write',
        title: 'Manage storage bucket configuration',
        actions: ['read only', 'read-write', 'no access'],
      },
      {
        resource: 'project:telemetry:logs:read',
        title: 'View project log analytics',
        actions: ['read only', 'no access'],
      },
      {
        resource: 'project:telemetry:usage:read',
        title: 'Access usage analytics data',
        actions: ['read only', 'no access'],
      },
    ],
  },
]
