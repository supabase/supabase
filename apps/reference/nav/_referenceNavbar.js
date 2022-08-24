const buildNavbar = ({ baseUrl }) => {
  // We need to remove the starting/trailing slash from the baseUrl
  const trimmedBaseUrl = baseUrl.slice(1, -1)
  return [
    {
      to: '/',
      label: 'Guides',
      activeBaseRegex: `.*.docs/$|^/${trimmedBaseUrl}/architecture|(^/${trimmedBaseUrl}/guides/(database|auth|storage|api|examples!))|(^/${trimmedBaseUrl}/guides/(examples|with-angular|with-flutter|with-nextjs|with-nuxt-3|with-react|with-redwoodjs|with-svelte|with-vue-3)|^/${trimmedBaseUrl}/faq|^/${trimmedBaseUrl}/going-into-prod|^/${trimmedBaseUrl}/handbook|^/${trimmedBaseUrl}/company)`,
      position: 'left',
    },
    {
      to: '/reference',
      label: 'Reference',
      position: 'left',
      activeBaseRegex: `^/${trimmedBaseUrl}/reference$|^/${trimmedBaseUrl}/reference/$`, // exactly match "/${trimmedBaseUrl}/reference/" only
    },
    { href: 'https://app.supabase.com', label: 'Dashboard', position: 'right' },
    {
      href: 'https://github.com/supabase/supabase',
      className: 'navbar-item-github',
      position: 'right',
    },
    {
      href: 'https://discord.supabase.com',
      className: 'navbar-item-discord',
      position: 'right',
    },
    {
      href: 'https://twitter.com/supabase',
      className: 'navbar-item-twitter',
      position: 'right',
    },
    /**
     * OFFICIAL REFERENCE
     */
    // API
    // {
    //   to: 'reference/api',
    //   position: 'left',
    //   label: 'API',
    //   supabaseCustomNavBarRegex: `(^/${trimmedBaseUrl}/reference/api$|${trimmedBaseUrl}/reference/api/)`,
    // },
    // {
    //   type: 'docsVersionDropdown',
    //   position: 'left',
    //   docsPluginId: '_api',
    //   supabaseCustomNavBarRegex: '(^/api$|api/)',
    // },
    // CLI
    // {
    //   to: 'reference/cli',
    //   position: 'left',
    //   label: 'CLI',
    //   supabaseCustomNavBarRegex: `(^/${trimmedBaseUrl}/reference/cli$|${trimmedBaseUrl}/reference/cli/)`,
    // },
    // {
    //   type: 'docsVersionDropdown',
    //   position: 'left',
    //   docsPluginId: '_cli',
    //   supabaseCustomNavBarRegex: '(^/cli$|cli/)',
    // },
    // supabase-js
    // {
    //   to: 'reference/javascript',
    //   position: 'left',
    //   label: 'JavaScript Library',
    //   supabaseCustomNavBarRegex: `(^/${trimmedBaseUrl}/reference/javascript$|${trimmedBaseUrl}/reference/javascript/)`,
    // },
    {
      type: 'docsVersionDropdown',
      position: 'left',
      docsPluginId: '_supabase_js',
      supabaseCustomNavBarRegex: `(^/${trimmedBaseUrl}/reference/javascript$|${trimmedBaseUrl}/reference/javascript/)`,
    },
    /**
     * TOOLS
     */
    // GoTrue
    // {
    //   to: 'reference/auth',
    //   position: 'left',
    //   label: 'Auth Server',
    //   supabaseCustomNavBarRegex: `(^/${trimmedBaseUrl}/reference/auth$|${trimmedBaseUrl}/reference/auth/)`,
    // },
    // {
    //   type: 'docsVersionDropdown',
    //   position: 'left',
    //   docsPluginId: '_gotrue',
    //   supabaseCustomNavBarRegex: '(^/gotrue$|gotrue/)',
    // },
    // Storage
    // {
    //   to: 'reference/storage',
    //   position: 'left',
    //   label: 'Storage Server',
    //   supabaseCustomNavBarRegex: `(^/${trimmedBaseUrl}/reference/storage$|${trimmedBaseUrl}/reference/storage/)`,
    // },
    // {
    //   type: 'docsVersionDropdown',
    //   position: 'left',
    //   docsPluginId: '_storage',
    //   supabaseCustomNavBarRegex: '(^/storage$|storage/)',
    // },
    /**
     * COMMUNITY
     */
    // {
    //   to: 'reference/supabase-dart',
    //   position: 'left',
    //   label: 'Dart Library',
    //   supabaseCustomNavBarRegex: `(^/${trimmedBaseUrl}/reference/dart$|${trimmedBaseUrl}/reference/dart/)`,
    // },
    // {
    //   type: 'docsVersionDropdown',
    //   position: 'left',
    //   docsPluginId: '_supabase_dart',
    //   supabaseCustomNavBarRegex: '(^/supabase-dart$|supabase-dart/)',
    // },
    // {
    //   to: 'reference/auth-helpers',
    //   position: 'left',
    //   label: 'Auth Helpers',
    //   supabaseCustomNavBarRegex: `(^/${trimmedBaseUrl}/reference/auth-helpers$|${trimmedBaseUrl}/reference/auth-helpers/)`,
    // },
    // {
    //   type: 'docsVersionDropdown',
    //   position: 'left',
    //   docsPluginId: '_auth_helpers',
    //   supabaseCustomNavBarRegex: '(^/auth-helpers$|auth-helpers/)',
    // // },
  ]
}

module.exports = { buildNavbar }
