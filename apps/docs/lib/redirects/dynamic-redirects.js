export const dynamicRedirects = [
  {
    basePath: false,
    permanent: true,
    source: '/docs/guides/reports/:match*',
    destination: '/docs/guides/observability/:match*',
  },
  {
    basePath: false,
    permanent: true,
    source: '/docs/guides/telemetry/:match*',
    destination: '/docs/guides/observability/:match*',
  },
  {
    basePath: false,
    permanent: true,
    source: '/docs/guides/monitoring-and-debugging/:match*',
    destination: '/docs/guides/observability/:match*',
  },
  {
    basePath: false,
    permanent: false,
    source: '/docs/careers',
    destination: 'https://about.supabase.com/careers',
  },
  {
    basePath: false,
    permanent: false,
    source: '/docs/careers/:match*',
    destination: 'https://about.supabase.com/careers/:match*',
  },
  {
    basePath: false,
    permanent: true,
    source: '/docs/guides/auth/auth-helpers/:path*',
    destination: '/docs/guides/auth/server-side/migrating-to-ssr-from-auth-helpers',
  },
  {
    basePath: false,
    permanent: true,
    source: '/docs/guides/auth/social-login/:path*',
    destination: '/docs/guides/auth/social-sign-in/:path*',
  },
  {
    basePath: false,
    permanent: true,
    source: '/docs/guides/cli/github-actions/:path*',
    destination: '/docs/guides/deployment/ci/:path*',
  },
  {
    basePath: false,
    permanent: true,
    source: '/docs/guides/cli/:path*',
    destination: '/docs/guides/local-development/cli/:path*',
  },
  {
    basePath: false,
    permanent: true,
    source: '/docs/guides/platform/terraform/:path*',
    destination: '/docs/guides/deployment/terraform/:path*',
  },
  {
    basePath: false,
    permanent: true,
    source: '/docs/guides/platform/migrating-to-supabase/:slug',
    destination: '/kb/guides/migrate-from-:slug',
  },
  {
    basePath: false,
    permanent: true,
    source: '/docs/guides/resources/migrating-to-supabase/:slug',
    destination: '/kb/guides/migrate-from-:slug',
  },
  {
    basePath: false,
    permanent: true,
    source: '/docs/guides/migrations/:slug',
    destination: '/kb/guides/migrate-from-:slug',
  },
  {
    basePath: false,
    permanent: true,
    source: '/docs/guides/monitoring-troubleshooting/:path*',
    destination: '/docs/guides/telemetry/:path*',
  },
  {
    basePath: false,
    permanent: true,
    source: '/docs/guides/getting-started/ai-prompts/:slug',
    destination: '/docs/guides/ai-tools/ai-prompts/:slug',
  },
  // Remaining troubleshooting guides whose docs slug matches the KB slug exactly.
  // Hash-suffixed slugs are handled above (KB drops the suffix).
  {
    basePath: false,
    permanent: true,
    source:
      '/docs/guides/troubleshooting/:slug((?!_template(?:\\.md)?$)(?![^/]*-[0-9a-f]{6}(?:\\.md)?$)[^/]+)',
    destination: '/kb/troubleshooting/:slug',
  },
  // Dev and preview only redirects
  // Redirect root to docs base path
  {
    source: '/',
    destination: '/docs',
    basePath: false,
    permanent: false,
  },
  // Redirect dashboard links in dev/preview envs
  {
    source: '/dashboard/:path*',
    destination: 'https://supabase.com/dashboard/:path*',
    basePath: false,
    permanent: false,
  },
  // Redirect blog links in dev/preview envs
  {
    source: '/blog/:path*',
    destination: 'https://supabase.com/blog/:path*',
    basePath: false,
    permanent: false,
  },
]
