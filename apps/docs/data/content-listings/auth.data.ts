import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const authGetStarted: ContentListingGroup = {
  id: 'auth-get-started',
  heading: 'Get started',
  description: "Start here if you're new to Supabase Auth:",
  type: 'grid',
  items: [
    {
      title: 'Auth with email and password',
      href: '/guides/auth/passwords',
      description: 'Sign up and sign in users with email and password.',
    },
    {
      title: 'Server-side rendering',
      href: '/guides/auth/server-side',
      description: 'Create a Supabase client for SSR frameworks like Next.js and SvelteKit.',
    },
    {
      title: 'Which package to use',
      href: '/guides/auth/choosing-a-server-package',
      description: 'supabase-js vs @supabase/ssr vs @supabase/server — which to use on the server.',
    },
    {
      title: 'Row Level Security',
      href: '/guides/database/postgres/row-level-security',
      description: 'Use RLS policies to authorize data access from the client.',
    },
  ],
}

export const authPricing: ContentListingGroup = {
  id: 'auth-pricing',
  heading: 'Pricing',
  description:
    'Charges apply to Monthly Active Users (MAU), Monthly Active Third-Party Users (Third-Party MAU), and Monthly Active SSO Users (SSO MAU) and Advanced MFA Add-ons. For a detailed breakdown of how these charges are calculated, refer to the following pages.',
  type: 'list',
  items: [
    {
      title: 'Pricing MAU',
      href: '/guides/platform/manage-your-usage/monthly-active-users',
      description: 'How MAU usage is measured and billed.',
    },
    {
      title: 'Pricing Third-Party MAU',
      href: '/guides/platform/manage-your-usage/monthly-active-users-third-party',
      description: 'How third-party auth MAU is measured and billed.',
    },
    {
      title: 'Pricing SSO MAU',
      href: '/guides/platform/manage-your-usage/monthly-active-users-sso',
      description: 'How SSO MAU usage is measured and billed.',
    },
    {
      title: 'Advanced MFA - Phone',
      href: '/guides/platform/manage-your-usage/advanced-mfa-phone',
      description: 'How Advanced MFA Phone add-on usage is measured and billed.',
    },
  ],
}

export const authNextSteps: ContentListingGroup = {
  id: 'auth-next-steps',
  heading: 'Next steps',
  description:
    "Once you've covered the basics, these guides help with other use cases and features:",
  type: 'grid',
  columns: 4,
  items: [
    {
      title: 'Email (Magic link or OTP)',
      href: '/guides/auth/auth-email-passwordless',
      description:
        'Sign up and sign in users with a Magic Link or email OTP instead of a password.',
    },
    {
      title: 'Enterprise SSO',
      href: '/guides/auth/enterprise-sso',
      description: 'Add Single Sign-On for enterprise applications with SAML 2.0.',
    },
    {
      title: 'User sessions',
      href: '/guides/auth/sessions',
      description: 'Control session lifetime, refresh tokens, and multi-device sign-in behavior.',
    },
    {
      title: 'Third-party auth',
      href: '/guides/auth/third-party/overview',
      description: 'Use Clerk, Auth0, Firebase Auth, Cognito, or WorkOS JWTs with Supabase APIs.',
    },
    {
      title: 'Multi-factor authentication',
      href: '/guides/auth/auth-mfa',
      description: 'Add a second factor to user sign-in with TOTP or phone.',
    },
    {
      title: 'JWTs',
      href: '/guides/auth/jwts',
      description: 'Understand how Supabase Auth issues and validates JWTs.',
    },
    {
      title: 'Auth Hooks',
      href: '/guides/auth/auth-hooks',
      description: 'Customize Auth behavior with Postgres functions at key lifecycle points.',
    },
  ],
}
