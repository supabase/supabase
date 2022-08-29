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
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can read billing email',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can change billing email',
      permissions: {
        owner: true,
        admin: false,
        developer: false,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can view subscription',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can update subscription',
      permissions: {
        owner: true,
        admin: true,
        developer: false,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can read billing address',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can update billing address',
      permissions: {
        owner: true,
        admin: true,
        developer: false,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can read tax codes',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can update tax codes',
      permissions: {
        owner: true,
        admin: true,
        developer: false,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can read payment methods',
      permissions: {
        owner: true,
        admin: true,
        developer: true,
        read_only: false,
        billing_only: false,
      },
    },
    {
      description: 'Can update payment methods',
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
  ],
}

export const PERMISSIONS_MAPPING = [
  ORGANIZATIONS_PERMISSIONS,
  MEMBERS_MANAGEMENT_PERMISSIONS,
  BILLING_PERMISSIONS,
  PROJECT_PERMISSIONS,
]
