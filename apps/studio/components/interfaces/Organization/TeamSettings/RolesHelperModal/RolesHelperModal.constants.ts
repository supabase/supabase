const ORGANIZATIONS_PERMISSIONS = {
  title: 'Organization',
  actions: [
    {
      description: 'Can change organization name',
      permissions: {
        owner: true,
        admin: false,
        developer: false,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can delete organization',
      permissions: {
        owner: true,
        admin: false,
        developer: false,
        read_only: false,
        billing_only: false,
      },
    },
  ],
}

const MEMBERS_MANAGEMENT_PERMISSIONS = {
  title: 'Members',
  actions: [
    {
      description: 'Can add an Owner',
      permissions: {
        owner: true,
        admin: false,
        developer: false,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can remove an Owner',
      permissions: {
        owner: true,
        admin: false,
        developer: false,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can add an Adminstrator',
      permissions: {
        owner: true,
        admin: true,
        developer: false,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can remove an Administrator',
      permissions: {
        owner: true,
        admin: true,
        developer: false,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can add a Developer',
      permissions: {
        owner: true,
        admin: true,
        developer: false,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can remove a Developer',
      permissions: {
        owner: true,
        admin: true,
        developer: false,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can revoke an invite',
      permissions: {
        owner: true,
        admin: true,
        developer: false,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can resend an invite',
      permissions: {
        owner: true,
        admin: true,
        developer: false,
        read_only: false,
        billing_only: false,
      },
    },
  ],
}

const BILLING_PERMISSIONS = {
  title: 'Billing',
  actions: [
    {
      description: 'Can read invoices',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: true,
      },
    },
    {
      description: 'Can read billing email',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: true,
      },
    },
    {
      description: 'Can change billing email',
      permissions: {
        owner: true,
        admin: false,
        developer: false,
        read_only: false,
        billing_only: true,
      },
    },
    {
      description: 'Can view subscription',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: true,
      },
    },
    {
      description: 'Can update subscription',
      permissions: {
        owner: true,
        admin: true,
        developer: false,
        read_only: false,
        billing_only: true,
      },
    },
    {
      description: 'Can read billing address',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: true,
      },
    },
    {
      description: 'Can update billing address',
      permissions: {
        owner: true,
        admin: true,
        developer: false,
        read_only: false,
        billing_only: true,
      },
    },
    {
      description: 'Can read tax codes',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: true,
      },
    },
    {
      description: 'Can update tax codes',
      permissions: {
        owner: true,
        admin: true,
        developer: false,
        read_only: false,
        billing_only: true,
      },
    },
    {
      description: 'Can read payment methods',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: true,
      },
    },
    {
      description: 'Can update payment methods',
      permissions: {
        owner: true,
        admin: true,
        developer: false,
        read_only: false,
        billing_only: true,
      },
    },
  ],
}

const PROJECT_PERMISSIONS = {
  title: 'Projects',
  actions: [
    {
      description: 'Can view projects',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: false,
      },
    },
    {
      description: 'Can create a project',
      permissions: {
        owner: true,
        admin: true,
        developer: false,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can delete a project',
      permissions: {
        owner: true,
        admin: true,
        developer: false,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can update a project',
      permissions: {
        owner: true,
        admin: true,
        developer: false,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can pause a project',
      permissions: {
        owner: true,
        admin: true,
        developer: false,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can resume a project',
      permissions: {
        owner: true,
        admin: true,
        developer: false,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can restart a project',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can read API anon keys',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: false,
      },
    },
    {
      description: 'Can read API secret keys',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can read JWT secret',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can generate new JWT secret',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can update API settings',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
  ],
}

const DATABASE_PERMISSIONS = {
  title: 'Database',
  actions: [
    {
      description: 'Can read tables',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: false,
      },
    },
    {
      description: 'Can create/update/delete tables',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can read RLS policies',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: false,
      },
    },
    {
      description: 'Can read create/update/delete RLS policies',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can read database extensions',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: false,
      },
    },
    {
      description: 'Can read update database extensions',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can read scheduled database backups',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: false,
      },
    },
    {
      description: 'Can trigger a scheduled database backup',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can read PITR database backups',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: false,
      },
    },
    {
      description: 'Can trigger a PITR database backup',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can read database replications',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: false,
      },
    },
    {
      description: 'Can update database replications',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can read database triggers',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: false,
      },
    },
    {
      description: 'Can create/update/delete database triggers',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can read database functions',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: false,
      },
    },
    {
      description: 'Can create/update/delete database functions',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can read database webhooks',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: false,
      },
    },
    {
      description: 'Can create/update/delete database webhooks',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
  ],
}

const SQL_EDITOR_PERMISSIONS = {
  title: 'SQL Editor',
  actions: [
    {
      description: 'Can run a SELECT-based query',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: false,
      },
    },
    {
      description: 'Can run all other types of queries',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can create/update/delete queries',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: false,
      },
    },
  ],
}

const STORAGE_PERMISSIONS = {
  title: 'Storage',
  actions: [
    {
      description: 'Can access storage',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
  ],
}

const AUTHENTICATION_PERMISSIONS = {
  title: 'Authentication',
  actions: [
    {
      description: 'Can view users',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: false,
      },
    },
    {
      description: 'Can remove users',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can invite users',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can read authentication settings',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: false,
      },
    },
    {
      description: 'Can update authentication settings',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can view authentication logs',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: false,
      },
    },
  ],
}

const EDGE_FUNCTIONS_PERMISSIONS = {
  title: 'Edge Functions',
  actions: [
    {
      description: 'Can view edge functions',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: false,
      },
    },
  ],
}

const LOGS_EXPLORER_PERMISSIONS = {
  title: 'Logs Explorer',
  actions: [
    {
      description: 'Can view logs explorer',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: false,
      },
    },
    {
      description: 'Can create queries in the logs explorer',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: false,
      },
    },
  ],
}

const REPORTS_PERMISSIONS = {
  title: 'Reports',
  actions: [
    {
      description: 'Can view reports',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: true,
        billing_only: false,
      },
    },
    {
      description: 'Can create/update a report',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
  ],
}

export const PERMISSIONS_MAPPING = [
  ORGANIZATIONS_PERMISSIONS,
  MEMBERS_MANAGEMENT_PERMISSIONS,
  BILLING_PERMISSIONS,
  PROJECT_PERMISSIONS,
  DATABASE_PERMISSIONS,
  SQL_EDITOR_PERMISSIONS,
  STORAGE_PERMISSIONS,
  AUTHENTICATION_PERMISSIONS,
  EDGE_FUNCTIONS_PERMISSIONS,
  LOGS_EXPLORER_PERMISSIONS,
  REPORTS_PERMISSIONS,
]
