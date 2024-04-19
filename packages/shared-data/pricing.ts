type Pricing = {
  database: PricingCategory
  auth: PricingCategory
  storage: PricingCategory
  edge_functions: PricingCategory
  realtime: PricingCategory
  dashboard: PricingCategory
  security: PricingCategory
  support: PricingCategory
}

type PricingCategory = {
  title: string
  icon: string
  features: PricingFeature[]
}

type PricingFeature = {
  title: string
  tooltips?: { main?: string; pro?: string; team?: string; enterprise?: string }
  plans: {
    free: boolean | string | string[]
    pro: boolean | string | string[]
    team: boolean | string | string[]
    enterprise: boolean | string | string[]
  }
  usage_based: boolean
}

export const pricing: Pricing = {
  database: {
    title: 'Database',
    icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
    features: [
      {
        title: 'Dedicated Postgres Database',
        tooltips: {
          main: 'A Postgres database with no restrictions? You get it. No pseudo limited users, you are the postgres root user.  No caveats.',
        },
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'Unlimited API requests',
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'Database size',
        tooltips: {
          main: 'Billing is based on the average daily database size in GB throughout the billing period.',
        },
        plans: {
          free: '500 MB included',
          pro: ['8 GB included', 'then $0.125 per GB'],
          team: ['8 GB included', 'then $0.125 per GB'],
          enterprise: 'Custom',
        },
        usage_based: true,
      },
      {
        title: 'Automatic backups',
        tooltips: {
          main: 'Backups are entire copies of your database that can be restored in the future.',
          pro: '7 days of backup (if > 1 TB, contact for Enterprise pricing)',
          team: '14 days of backup (if > 1 TB, contact for Enterprise pricing)',
        },
        plans: {
          free: false,
          pro: '7 days',
          team: '14 days',
          enterprise: 'Custom',
        },
        usage_based: false,
      },
      {
        title: 'Point in time recovery',
        tooltips: {
          main: 'PITR cannot be applied retroactively, projects can only be rolled back to the point from which PITR has been applied.',
        },
        plans: {
          free: false,
          pro: '$100 per 7 days',
          team: '$100 per 7 days',
          enterprise: '$100 per 7 days, >28 days available',
        },
        usage_based: false,
      },
      {
        title: 'Pausing',
        tooltips: {
          main: 'Projects that have no activity or API requests will be paused. They can be reactivated via the dashboard.',
        },
        plans: {
          free: 'After 1 week of inactivity',
          pro: 'Never',
          team: 'Never',
          enterprise: 'Never',
        },
        usage_based: false,
      },
      {
        title: 'Bandwidth',
        tooltips: {
          main: 'Billing is based on the total sum of all outgoing traffic (includes Database, Storage, Realtime, Auth, API, Edge Functions, Supavisor) in GB throughout your billing period.',
        },
        plans: {
          free: '5 GB included',
          pro: ['250 GB included', 'then $0.09 per GB'],
          team: ['250 GB included', 'then $0.09 per GB'],
          enterprise: 'Custom',
        },
        usage_based: true,
      },
    ],
  },
  auth: {
    title: 'Auth',
    icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
    features: [
      {
        title: 'Total Users',
        tooltips: { main: 'The maximum number of users your project can have' },
        plans: {
          free: 'Unlimited',
          pro: 'Unlimited',
          team: 'Unlimited',
          enterprise: 'Unlimited',
        },
        usage_based: false,
      },
      {
        title: 'MAUs',
        tooltips: {
          main: 'Users who log in or refresh their token count towards MAU.\nBilling is based on the sum of distinct users requesting your API throughout the billing period. Resets every billing cycle.',
        },
        plans: {
          free: '50,000 included',
          pro: ['100,000 included', 'then $0.00325 per MAU'],
          team: ['100,000 included', 'then $0.00325 per MAU'],
          enterprise: 'Custom',
        },
        usage_based: true,
      },
      {
        title: 'Anonymous Sign-ins',
        tooltips: {
          main: 'Anonymous user requests count towards MAU, just like a permanent user.',
        },
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'Social OAuth providers',
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'Custom SMTP server',
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'Remove Supabase branding from emails',
        plans: {
          free: false,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'Audit trails',
        plans: {
          free: '1 hour',
          pro: '7 days',
          team: '28 days',
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'Single Sign-On (SAML 2.0)',
        plans: {
          free: false,
          pro: ['50 included', 'then $0.015 per MAU'],
          team: ['50 included', 'then $0.015 per MAU'],
          enterprise: 'Contact Us',
        },
        usage_based: false,
      },
      {
        title: 'Leaked password protection',
        plans: {
          free: false,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'Single session per user',
        plans: {
          free: false,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'Session timeouts',
        plans: {
          free: false,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'Auth Hooks',
        plans: {
          free: 'Custom Access Token (JWT)',
          pro: 'Custom Access Token (JWT)',
          team: 'All',
          enterprise: 'All',
        },
        usage_based: false,
      },
      {
        title: 'Advanced security features',
        plans: {
          free: false,
          pro: false,
          team: false,
          enterprise: 'Contact Us',
        },
        usage_based: false,
      },
    ],
  },
  storage: {
    title: 'Storage',
    icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',

    features: [
      {
        title: 'Storage',
        tooltips: {
          main: "The sum of all objects' size in your storage buckets.\nBilling is based on the average daily size in GB throughout your billing period.",
        },
        plans: {
          free: '1 GB included',
          pro: ['100 GB included', 'then $0.021 per GB'],
          team: ['100 GB included', 'then $0.021 per GB'],
          enterprise: 'Custom',
        },
        usage_based: true,
      },
      {
        title: 'Custom access controls',
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'Max file upload size',
        tooltips: { main: 'You can change the upload size in the dashboard' },
        plans: {
          free: '50 MB',
          pro: '50 GB',
          team: '50 GB',
          enterprise: 'Custom',
        },
        usage_based: false,
      },
      {
        title: 'Content Delivery Network',
        tooltips: {
          main: 'Assets in Storage are automatically cached on a CDN. With Smart CDN caching enabled, the CDN cache is automatically re-validated when the underlying asset changes. CDN caching is enabled across all plans and assets in the paid plans are cached via the Smart CDN.',
        },
        plans: {
          free: 'Basic CDN',
          pro: 'Smart CDN',
          team: 'Smart CDN',
          enterprise: 'Smart CDN',
        },
        usage_based: false,
      },
      {
        title: 'Image Transformations',
        tooltips: {
          main: 'We count all images that were transformed in the billing period, ignoring any transformations.\nUsage example: You transform one image with four different size transformations and another image with just a single transformation. It counts as two, as only two images were transformed.\nBilling is based on the count of (origin) images that used transformations throughout the billing period. Resets every billing cycle.',
        },
        plans: {
          free: false,
          pro: ['100 origin images included', 'then $5 per 1000 origin images'],
          team: ['100 origin images included', 'then $5 per 1000 origin images'],
          enterprise: 'Custom',
        },
        usage_based: true,
      },
      {
        title: 'Bring your own storage provider',
        plans: {
          free: false,
          pro: false,
          team: false,
          enterprise: true,
        },
        usage_based: false,
      },
    ],
  },
  edge_functions: {
    title: 'Edge Functions',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    features: [
      {
        title: 'Invocations',
        tooltips: {
          main: 'Billing is based on the sum of all invocations, independent of response status, throughout your billing period.',
        },
        plans: {
          free: '500,000 included',
          pro: ['2 Million included', 'then $2 per 1 Million'],
          team: ['2 Million included', 'then $2 per 1 Million'],
          enterprise: 'Custom',
        },
        usage_based: true,
      },
      {
        title: 'Script size',
        plans: {
          free: '10 MB',
          pro: '10 MB',
          team: '10 MB',
          enterprise: 'Custom',
        },
        usage_based: false,
      },
      {
        title: 'Number of functions',
        tooltips: {
          main: 'Billing is based on the maximum amount of functions at any point in time throughout your billing period.',
        },
        plans: {
          free: '10 included',
          pro: ['100 included', 'then $10 per additional 100'],
          team: ['100 included', 'then $10 per additional 100'],
          enterprise: 'Custom',
        },
        usage_based: true,
      },
    ],
  },
  realtime: {
    title: 'Realtime',
    icon: 'M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59',
    features: [
      {
        title: 'Postgres Changes',
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'Concurrent Peak Connections',
        tooltips: {
          main: 'Total number of successful connections. Connections attempts are not counted towards usage.\nBilling is based on the maximum amount of concurrent peak connections throughout your billing period.',
        },
        plans: {
          free: '200 included',
          pro: ['500 included', 'then $10 per 1000'],
          team: ['500 included', 'then $10 per 1000'],
          enterprise: 'Custom concurrent connections and volume discount',
        },
        usage_based: true,
      },
      {
        title: 'Messages Per Month',
        tooltips: {
          main: "Count of messages going through Realtime. Includes database changes, broadcast and presence. \nUsage example: If you do a database change and 5 clients listen to that change via Realtime, that's 5 messages. If you broadcast a message and 4 clients listen to that, that's 5 messages (1 message sent, 4 received).\nBilling is based on the total amount of messages throughout your billing period.",
        },
        plans: {
          free: '2 Million included',
          pro: ['5 Million included', 'then $2.50 per Million'],
          team: ['5 Million included', 'then $2.50 per Million'],
          enterprise: 'Volume discounts on messages',
        },
        usage_based: true,
      },
      {
        title: 'Max Message Size',
        plans: {
          free: '250 KB',
          pro: '3 MB',
          team: '3 MB',
          enterprise: 'Custom',
        },
        usage_based: false,
      },
    ],
  },
  dashboard: {
    title: 'Dashboard',
    icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
    features: [
      {
        title: 'Team members',
        plans: {
          free: 'Unlimited',
          pro: 'Unlimited',
          team: 'Unlimited',
          enterprise: 'Unlimited',
        },
        usage_based: false,
      },
      {
        title: 'Access controls',
        plans: {
          free: 'Coming soon',
          pro: 'Coming soon',
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'Audit trails',
        plans: {
          free: false,
          pro: false,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
    ],
  },
  security: {
    title: 'Platform Security and Compliance',
    icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    features: [
      {
        title: 'On Premises / BYO cloud',
        plans: {
          free: false,
          pro: false,
          team: false,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'Log retention (API & Database)',
        plans: {
          free: '1 day',
          pro: '7 days',
          team: '28 days',
          enterprise: '90 days',
        },
        usage_based: false,
      },
      {
        title: 'Log drain',
        plans: {
          free: false,
          pro: false,
          team: 'Coming soon',
          enterprise: 'Coming soon',
        },
        usage_based: false,
      },
      {
        title: 'Metrics endpoint',
        plans: {
          free: false,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'SOC2',
        plans: {
          free: false,
          pro: false,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'HIPAA',
        plans: {
          free: false,
          pro: false,
          team: 'Available as paid add-on',
          enterprise: 'Available as paid add-on',
        },
        tooltips: {
          main: 'Available as a paid add-on on Team plan and above.',
        },
        usage_based: false,
      },
      {
        title: 'SSO',
        plans: {
          free: false,
          pro: false,
          team: 'Contact Us',
          enterprise: 'Contact Us',
        },
        usage_based: false,
      },
      {
        title: 'Uptime SLAs',
        plans: {
          free: false,
          pro: false,
          team: false,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'Access Roles',
        plans: {
          free: 'Owner, Developer',
          pro: 'Owner, Developer',
          team: 'Additional owner(s), admin, read-only, billing admin, custom',
          enterprise: 'Additional owner(s), admin, read-only, billing admin, custom',
        },
        usage_based: false,
      },
      {
        title: 'Vanity URLs',
        plans: {
          free: false,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'Custom Domains',
        tooltips: {
          enterprise: 'Volume discounts available.',
        },
        plans: {
          free: false,
          pro: '$10 per domain per month per project add on',
          team: '$10 per domain per month per project add on',
          enterprise: '1, additional $10/domain/month',
        },
        usage_based: false,
      },
      {
        title: 'Bring your own cloud deployment options',
        tooltips: {
          main: 'On-Premises, single tenant, and managed dedicated cloud provider instance options',
        },
        plans: {
          free: false,
          pro: false,
          team: false,
          enterprise: true,
        },
        usage_based: false,
      },
    ],
  },
  support: {
    title: 'Support',
    icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z',
    features: [
      {
        title: 'Community Support',
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'Email Support',
        plans: {
          free: false,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'Email Support SLA',
        plans: {
          free: false,
          pro: false,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'Designated support',
        plans: {
          free: false,
          pro: false,
          team: false,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'On Boarding Support',
        plans: {
          free: false,
          pro: false,
          team: false,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'Designated Customer Success Team',
        plans: {
          free: false,
          pro: false,
          team: false,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        title: 'Security Questionnaire Help',
        plans: {
          free: false,
          pro: false,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
    ],
  },
}
