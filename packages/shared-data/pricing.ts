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
  key: FeatureKey
  plans: {
    free: boolean | string | string[]
    pro: boolean | string | string[]
    team: boolean | string | string[]
    enterprise: boolean | string | string[]
  }
  usage_based: boolean
}

export type FeatureKey =
  | 'database.dedicatedPostgresDatabase'
  | 'database.unlimitedApiRequests'
  | 'database.size'
  | 'database.advancedDiskConfig'
  | 'database.automaticBackups'
  | 'database.pitr'
  | 'database.pausing'
  | 'database.branching'
  | 'database.bandwidth'
  | 'auth.totalUsers'
  | 'auth.maus'
  | 'auth.userDataOwnership'
  | 'auth.anonSignIns'
  | 'auth.socialOAuthProviders'
  | 'auth.customSMTPServer'
  | 'auth.removeSupabaseBranding'
  | 'auth.auditTrails'
  | 'auth.basicMFA'
  | 'auth.advancedMFAPhone'
  | 'auth.thirdPartyMAUs'
  | 'auth.saml'
  | 'auth.leakedPasswordProtection'
  | 'auth.singleSessionPerUser'
  | 'auth.sessionTimeouts'
  | 'auth.authHooks'
  | 'auth.advancedSecurityFeatures'
  | 'storage.size'
  | 'storage.customAccessControls'
  | 'storage.maxFileSize'
  | 'storage.cdn'
  | 'storage.transformations'
  | 'storage.byoc'
  | 'functions.invocations'
  | 'functions.scriptSize'
  | 'functions.numberOfFunctions'
  | 'realtime.postgresChanges'
  | 'realtime.concurrentConnections'
  | 'realtime.messagesPerMonth'
  | 'realtime.maxMessageSize'
  | 'dashboard.teamMembers'
  | 'dashboard.auditTrails'
  | 'security.byoc'
  | 'security.logRetention'
  | 'security.logDrain'
  | 'security.metricsEndpoint'
  | 'security.soc2'
  | 'security.hipaa'
  | 'security.sso'
  | 'security.uptimeSla'
  | 'security.accessRoles'
  | 'security.vanityUrls'
  | 'security.customDomains'
  | 'support.communitySupport'
  | 'support.emailSupport'
  | 'support.emailSupportSla'
  | 'support.designatedSupport'
  | 'support.onBoardingSupport'
  | 'support.designatedCustomerSuccessTeam'
  | 'support.securityQuestionnaireHelp'

export const pricing: Pricing = {
  database: {
    title: 'Database',
    icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
    features: [
      {
        key: 'database.dedicatedPostgresDatabase',
        title: 'Dedicated Postgres Database',
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        key: 'database.unlimitedApiRequests',
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
        key: 'database.size',
        title: 'Database size',
        plans: {
          free: '500 MB database size per project included',
          pro: ['8 GB disk size per project included', 'then $0.125 per GB'],
          team: ['8 GB disk size per project included', 'then $0.125 per GB'],
          enterprise: 'Custom',
        },
        usage_based: true,
      },
      {
        key: 'database.advancedDiskConfig',
        title: 'Advanced disk config',
        plans: {
          free: false,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        key: 'database.automaticBackups',
        title: 'Automatic backups',
        plans: {
          free: false,
          pro: '7 days',
          team: '14 days',
          enterprise: 'Custom',
        },
        usage_based: false,
      },
      {
        key: 'database.pitr',
        title: 'Point in time recovery',
        plans: {
          free: false,
          pro: '$100 per month per 7 days retention',
          team: '$100 per month per 7 days retention',
          enterprise: '$100 per month per 7 days retention, >28 days retention available',
        },
        usage_based: false,
      },
      {
        key: 'database.pausing',
        title: 'Pausing',
        plans: {
          free: 'After 1 week of inactivity',
          pro: 'Never',
          team: 'Never',
          enterprise: 'Never',
        },
        usage_based: false,
      },
      {
        key: 'database.branching',
        title: 'Branching',
        plans: {
          free: false,
          pro: '$0.01344 per branch, per hour',
          team: '$0.01344 per branch, per hour',
          enterprise: 'Custom',
        },
        usage_based: true,
      },
      {
        key: 'database.bandwidth',
        title: 'Bandwidth',
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
        key: 'auth.totalUsers',
        title: 'Total Users',
        plans: {
          free: 'Unlimited',
          pro: 'Unlimited',
          team: 'Unlimited',
          enterprise: 'Unlimited',
        },
        usage_based: false,
      },
      {
        key: 'auth.maus',
        title: 'MAUs',
        plans: {
          free: '50,000 included',
          pro: ['100,000 included', 'then $0.00325 per MAU'],
          team: ['100,000 included', 'then $0.00325 per MAU'],
          enterprise: 'Custom',
        },
        usage_based: true,
      },
      {
        key: 'auth.userDataOwnership',
        title: 'User data ownership',
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        key: 'auth.anonSignIns',
        title: 'Anonymous Sign-ins',
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },

      {
        key: 'auth.socialOAuthProviders',
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
        key: 'auth.customSMTPServer',
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
        key: 'auth.removeSupabaseBranding',
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
        key: 'auth.auditTrails',
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
        key: 'auth.basicMFA',
        title: 'Basic Multi-Factor Auth',
        plans: {
          free: true,
          pro: true,
          team: true,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        key: 'auth.advancedMFAPhone',
        title: 'Advanced Multi-Factor Auth - Phone',
        plans: {
          free: false,
          pro: ['$75 per month for first project', 'then $10 per month per additional projects'],
          team: ['$75 per month for first project', 'then $10 per month per additional projects'],
          enterprise: 'Custom',
        },
        usage_based: false,
      },
      {
        key: 'auth.thirdPartyMAUs',
        title: 'Third-Party MAUs',
        plans: {
          free: '50,000 included',
          pro: ['100,000 included', 'then $0.00325 per MAU'],
          team: ['100,000 included', 'then $0.00325 per MAU'],
          enterprise: 'Custom',
        },
        usage_based: true,
      },
      {
        key: 'auth.saml',
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
        key: 'auth.leakedPasswordProtection',
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
        key: 'auth.singleSessionPerUser',
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
        key: 'auth.sessionTimeouts',
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
        key: 'auth.authHooks',
        title: 'Auth Hooks',
        plans: {
          free: 'Custom Access Token (JWT), Send custom email/SMS',
          pro: 'Custom Access Token (JWT), Send custom email/SMS',
          team: 'All',
          enterprise: 'All',
        },
        usage_based: false,
      },
      {
        key: 'auth.advancedSecurityFeatures',
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
        key: 'storage.size',
        title: 'Storage',
        plans: {
          free: '1 GB included',
          pro: ['100 GB included', 'then $0.021 per GB'],
          team: ['100 GB included', 'then $0.021 per GB'],
          enterprise: 'Custom',
        },
        usage_based: true,
      },
      {
        key: 'storage.customAccessControls',
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
        key: 'storage.maxFileSize',
        title: 'Max file upload size',
        plans: {
          free: '50 MB',
          pro: '500 GB',
          team: '500 GB',
          enterprise: 'Custom',
        },
        usage_based: false,
      },
      {
        key: 'storage.cdn',
        title: 'Content Delivery Network',
        plans: {
          free: 'Basic CDN',
          pro: 'Smart CDN',
          team: 'Smart CDN',
          enterprise: 'Smart CDN',
        },
        usage_based: false,
      },
      {
        key: 'storage.transformations',
        title: 'Image Transformations',
        plans: {
          free: false,
          pro: ['100 origin images included', 'then $5 per 1000 origin images'],
          team: ['100 origin images included', 'then $5 per 1000 origin images'],
          enterprise: 'Custom',
        },
        usage_based: true,
      },
      {
        key: 'storage.byoc',
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
        key: 'functions.invocations',
        title: 'Invocations',
        plans: {
          free: '500,000 included',
          pro: ['2 Million included', 'then $2 per 1 Million'],
          team: ['2 Million included', 'then $2 per 1 Million'],
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
        key: 'realtime.postgresChanges',
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
        key: 'realtime.concurrentConnections',
        title: 'Concurrent Peak Connections',
        plans: {
          free: '200 included',
          pro: ['500 included', 'then $10 per 1000'],
          team: ['500 included', 'then $10 per 1000'],
          enterprise: 'Custom concurrent connections and volume discount',
        },
        usage_based: true,
      },
      {
        key: 'realtime.messagesPerMonth',
        title: 'Messages Per Month',
        plans: {
          free: '2 Million included',
          pro: ['5 Million included', 'then $2.50 per Million'],
          team: ['5 Million included', 'then $2.50 per Million'],
          enterprise: 'Volume discounts on messages',
        },
        usage_based: true,
      },
      {
        key: 'realtime.maxMessageSize',
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
        key: 'dashboard.teamMembers',
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
        key: 'dashboard.auditTrails',
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
        key: 'security.byoc',
        title: 'BYO cloud',
        plans: {
          free: false,
          pro: false,
          team: false,
          enterprise: true,
        },
        usage_based: false,
      },
      {
        key: 'security.logRetention',
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
        key: 'security.logDrain',
        title: 'Log Drain',
        plans: {
          free: false,
          pro: false,
          team: [
            '$60 per drain per month',
            '+ $0.20 per million events',
            '+ $0.09 per GB bandwidth',
          ],
          enterprise: 'Custom',
        },
        usage_based: true,
      },
      {
        key: 'security.metricsEndpoint',
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
        key: 'security.soc2',
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
        key: 'security.hipaa',
        title: 'HIPAA',
        plans: {
          free: false,
          pro: false,
          team: 'Available as paid add-on',
          enterprise: 'Available as paid add-on',
        },
        usage_based: false,
      },
      {
        key: 'security.sso',
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
        key: 'security.uptimeSla',
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
        key: 'security.accessRoles',
        title: 'Access Roles',
        plans: {
          free: 'Owner, Admin, Developer',
          pro: 'Owner, Admin, Developer',
          team: 'Owner, Admin, Developer, Read-only, Predefined project scoped roles',
          enterprise: 'Custom project scoped roles',
        },
        usage_based: false,
      },
      {
        key: 'security.vanityUrls',
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
        key: 'security.customDomains',
        title: 'Custom Domains',
        plans: {
          free: false,
          pro: '$10 per domain per month per project add on',
          team: '$10 per domain per month per project add on',
          enterprise: '1, additional $10/domain/month',
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
        key: 'support.communitySupport',
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
        key: 'support.emailSupport',
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
        key: 'support.emailSupportSla',
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
        key: 'support.designatedSupport',
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
        key: 'support.onBoardingSupport',
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
        key: 'support.designatedCustomerSuccessTeam',
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
        key: 'support.securityQuestionnaireHelp',
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
